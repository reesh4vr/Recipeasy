
const axios = require('axios');
const sampleRecipes = require('../data/sampleRecipes');


const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get cached data or null if expired/missing
 */
const getFromCache = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

/**
 * Store data in cache
 */
const setCache = (key, data) => {
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

const hasConfiguredApiKey = () => Boolean(process.env.SPOONACULAR_API_KEY || process.env.RECIPE_API_KEY);


const normalizeIngredientTokens = (ingredients) => ingredients
  .split(',')
  .map(item => item.trim().toLowerCase())
  .filter(Boolean);


const matchesToken = (value = '', tokens = []) => {
  const normalizedValue = value.toLowerCase();
  return tokens.some(token => 
    normalizedValue.includes(token) || token.includes(normalizedValue)
  );
};


const cloneIngredient = (ingredient = {}) => ({
  name: ingredient.name,
  original: ingredient.original || ingredient.name || '',
  amount: ingredient.amount ?? null,
  unit: ingredient.unit || '',
  image: ingredient.image || null
});


const projectSampleRecipe = (recipe, tokens) => {
  const ingredients = recipe.ingredients || [];
  const usedIngredients = ingredients
    .filter(ingredient => matchesToken(ingredient.name || '', tokens))
    .map(cloneIngredient);

  if (usedIngredients.length === 0) {
    return null;
  }

  const missedIngredients = ingredients
    .filter(ingredient => !matchesToken(ingredient.name || '', tokens))
    .map(cloneIngredient);

  const totalIngredients = ingredients.length || 1;
  const matchPercentage = Math.round(
    (usedIngredients.length / totalIngredients) * 100
  );

  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes || 0,
    proteinGrams: recipe.proteinGrams || 0,
    calories: recipe.calories || 0,
    summary: recipe.summary || '',
    cuisines: recipe.cuisines || [],
    diets: recipe.diets || [],
    usedIngredientCount: usedIngredients.length,
    missedIngredientCount: missedIngredients.length,
    usedIngredients,
    missedIngredients,
    matchPercentage
  };
};


const buildSampleSearchResults = (ingredientList, minProtein, maxTime) => {
  const tokens = normalizeIngredientTokens(ingredientList);
  const numericMinProtein = Number(minProtein) || 0;
  const numericMaxTime = Number(maxTime) || 999;

  const enrichedRecipes = sampleRecipes
    .map(recipe => projectSampleRecipe(recipe, tokens))
    .filter(Boolean)
    .filter(recipe => recipe.proteinGrams >= numericMinProtein)
    .filter(recipe => numericMaxTime >= 999 ? true : recipe.readyInMinutes <= numericMaxTime);

  const rankedRecipes = rankRecipes(enrichedRecipes);

  return {
    recipes: rankedRecipes,
    total: rankedRecipes.length,
    filters: {
      ingredients: ingredientList,
      minProtein: numericMinProtein,
      maxTime: numericMaxTime
    },
    source: 'sample'
  };
};


const buildSampleRecipeDetail = (recipe = {}) => {
  const nutrients = Array.isArray(recipe.nutrition) && recipe.nutrition.length > 0
    ? recipe.nutrition.map(nutrient => ({
        name: nutrient.name,
        amount: nutrient.amount,
        unit: nutrient.unit,
        percentOfDailyNeeds: nutrient.percentOfDailyNeeds ?? 0
      }))
    : [
        { name: 'Calories', amount: recipe.calories || 0, unit: 'kcal', percentOfDailyNeeds: 0 },
        { name: 'Protein', amount: recipe.proteinGrams || 0, unit: 'g', percentOfDailyNeeds: 0 }
      ];

  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes || 0,
    servings: recipe.servings || 4,
    sourceUrl: recipe.sourceUrl || null,
    summary: recipe.summary || '',

    ingredients: (recipe.ingredients || []).map(ingredient => ({
      id: ingredient.id || null,
      name: ingredient.name,
      original: ingredient.original,
      amount: ingredient.amount,
      unit: ingredient.unit,
      image: ingredient.image || null
    })),

    instructions: recipe.instructions || '',
    analyzedInstructions: (recipe.steps || []).map((step, index) => ({
      number: index + 1,
      step
    })),

    nutrition: {
      calories: recipe.calories || 0,
      protein: recipe.proteinGrams || 0,
      nutrients
    },

    diets: recipe.diets || [],
    dishTypes: recipe.dishTypes || [],
    cuisines: recipe.cuisines || [],
    vegetarian: recipe.vegetarian ?? Boolean(recipe.diets?.includes('vegetarian')),
    vegan: recipe.vegan ?? Boolean(recipe.diets?.includes('vegan')),
    glutenFree: recipe.glutenFree ?? Boolean(recipe.diets?.includes('gluten free')),
    dairyFree: recipe.dairyFree ?? Boolean(recipe.diets?.includes('dairy free'))
  };
};


const buildSpoonacularUrl = (endpoint) => {
  return `https://api.spoonacular.com${endpoint}`;
};


const getApiKey = () => {
  const apiKey = process.env.SPOONACULAR_API_KEY || process.env.RECIPE_API_KEY;
  if (!apiKey) {
    throw new Error('SPOONACULAR_API_KEY not configured');
  }
  return apiKey;
};


const extractProtein = (nutrition) => {
  if (!nutrition || !nutrition.nutrients) return 0;
  
  const protein = nutrition.nutrients.find(n => 
    n.name.toLowerCase() === 'protein'
  );
  
  return protein ? Math.round(protein.amount) : 0;
};


const extractCalories = (nutrition) => {
  if (!nutrition || !nutrition.nutrients) return 0;
  
  const calories = nutrition.nutrients.find(n => 
    n.name.toLowerCase() === 'calories'
  );
  
  return calories ? Math.round(calories.amount) : 0;
};


const rankRecipes = (recipes) => {
  return recipes.sort((a, b) => {
    const matchA = a.usedIngredientCount / (a.usedIngredientCount + a.missedIngredientCount) || 0;
    const matchB = b.usedIngredientCount / (b.usedIngredientCount + b.missedIngredientCount) || 0;
    
    if (matchB !== matchA) {
      return matchB - matchA;
    }

    if (b.proteinGrams !== a.proteinGrams) {
      return b.proteinGrams - a.proteinGrams;
    }

    return a.readyInMinutes - b.readyInMinutes;
  });
};

/**
 * @desc    Search for recipes based on ingredients and filters
 * @route   POST /api/recipes/search
 * @access  Public
 */
const searchRecipes = async (req, res) => {
  const { ingredients, minProtein = 0, maxTime = 999 } = req.body;
  let ingredientList = '';
  let cacheKey = '';
  let respondWithSampleResults = null;

  try {

    if (!ingredients) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please provide at least one ingredient'
      });
    }

    ingredientList = Array.isArray(ingredients) 
      ? ingredients.join(',')
      : ingredients;

    if (!ingredientList.trim()) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please provide at least one ingredient'
      });
    }


    cacheKey = `search:${ingredientList}:${minProtein}:${maxTime}`;
    

    const cachedResult = getFromCache(cacheKey);
    if (cachedResult) {
      console.log('Returning cached search results');
      return res.json(cachedResult);
    }

    const useSampleEnvFlag = process.env.USE_SAMPLE_RECIPES;
    const forceSampleData = useSampleEnvFlag === 'true';
    const allowSampleFallback = useSampleEnvFlag !== 'false';
    const apiKeyConfigured = hasConfiguredApiKey();

    respondWithSampleResults = () => {
      if (!ingredientList) {
        return res.status(500).json({
          error: 'Search failed',
          message: 'Unable to build sample data without ingredients'
        });
      }
      const sampleResult = buildSampleSearchResults(ingredientList, minProtein, maxTime);
      if (cacheKey) {
        setCache(cacheKey, sampleResult);
      }
      return res.json(sampleResult);
    };

    if (forceSampleData) {
      console.log('Recipe search: forcing offline dataset due to USE_SAMPLE_RECIPES flag');
      return respondWithSampleResults();
    }

    if (!apiKeyConfigured && allowSampleFallback) {
      console.warn('Recipe search: no API key configured, serving offline dataset');
      return respondWithSampleResults();
    }

    const apiKey = getApiKey();

    const searchUrl = buildSpoonacularUrl('/recipes/findByIngredients');
    
    const searchResponse = await axios.get(searchUrl, {
      params: {
        apiKey,
        ingredients: ingredientList,
        number: 20, // Get more results to filter
        ranking: 1, // Maximize used ingredients
        ignorePantry: false
      }
    });

    if (!searchResponse.data || searchResponse.data.length === 0) {
      const emptyResult = { recipes: [], total: 0 };
      setCache(cacheKey, emptyResult);
      return res.json(emptyResult);
    }

    const recipeIds = searchResponse.data.map(r => r.id).join(',');

    const bulkUrl = buildSpoonacularUrl('/recipes/informationBulk');
    
    const bulkResponse = await axios.get(bulkUrl, {
      params: {
        apiKey,
        ids: recipeIds,
        includeNutrition: true
      }
    });

    const recipes = searchResponse.data
      .map(searchResult => {
        const detailInfo = bulkResponse.data.find(d => d.id === searchResult.id) || {};
        
        const proteinGrams = extractProtein(detailInfo.nutrition);
        const calories = extractCalories(detailInfo.nutrition);
        const readyInMinutes = detailInfo.readyInMinutes || 0;
        
        return {
          id: searchResult.id,
          title: searchResult.title,
          image: searchResult.image,
          usedIngredientCount: searchResult.usedIngredientCount || 0,
          missedIngredientCount: searchResult.missedIngredientCount || 0,
          usedIngredients: searchResult.usedIngredients || [],
          missedIngredients: searchResult.missedIngredients || [],
          readyInMinutes,
          proteinGrams,
          calories,
          summary: detailInfo.summary ? 
            detailInfo.summary.replace(/<[^>]*>/g, '').substring(0, 150) + '...' : '',
          matchPercentage: Math.round(
            (searchResult.usedIngredientCount / 
            (searchResult.usedIngredientCount + searchResult.missedIngredientCount)) * 100
          ) || 0
        };
      })

      .filter(recipe => {
        if (minProtein > 0 && recipe.proteinGrams < minProtein) {
          return false;
        }
        if (maxTime < 999 && recipe.readyInMinutes > maxTime) {
          return false;
        }
        return true;
      });


    const rankedRecipes = rankRecipes(recipes);

    const result = {
      recipes: rankedRecipes,
      total: rankedRecipes.length,
      filters: {
        ingredients: ingredientList,
        minProtein,
        maxTime
      }
    };

    setCache(cacheKey, result);

    res.json(result);

  } catch (error) {
    console.error('Recipe search error:', error.response?.data || error.message);

    const allowSampleFallback = process.env.USE_SAMPLE_RECIPES !== 'false';
    if (allowSampleFallback && respondWithSampleResults) {
      console.warn('Recipe search failed, falling back to offline dataset.');
      return respondWithSampleResults();
    }
    
    if (error.message === 'SPOONACULAR_API_KEY not configured') {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Recipe API is not configured. Please set SPOONACULAR_API_KEY.'
      });
    }
    
    if (error.response?.status === 402) {
      return res.status(503).json({
        error: 'API limit reached',
        message: 'Recipe search is temporarily unavailable. Please try again later.'
      });
    }
    
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for recipes'
    });
  }
};

/**
 * @desc    Get detailed recipe information
 * @route   GET /api/recipes/:id
 * @access  Public
 */
const getRecipeDetail = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (!id || Number.isNaN(numericId)) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid recipe ID'
    });
  }

  const cacheKey = `recipe:${numericId}`;
  const cachedResult = getFromCache(cacheKey);
  if (cachedResult) {
    console.log('Returning cached recipe detail');
    return res.json(cachedResult);
  }

  const useSampleEnvFlag = process.env.USE_SAMPLE_RECIPES;
  const forceSampleData = useSampleEnvFlag === 'true';
  const allowSampleFallback = useSampleEnvFlag !== 'false';

  const respondWithSampleDetail = () => {
    const sampleRecipe = sampleRecipes.find(recipe => recipe.id === numericId);
    if (!sampleRecipe) {
      return false;
    }

    const result = buildSampleRecipeDetail(sampleRecipe);
    setCache(cacheKey, result);
    res.json(result);
    return true;
  };

  if (forceSampleData) {
    if (respondWithSampleDetail()) {
      console.log('Recipe detail: forcing offline dataset due to USE_SAMPLE_RECIPES flag');
      return;
    }

    return res.status(404).json({
      error: 'Not found',
      message: 'Recipe not found'
    });
  }

  try {
    const apiKey = getApiKey();

    const url = buildSpoonacularUrl(`/recipes/${numericId}/information`);
    const response = await axios.get(url, {
      params: {
        apiKey,
        includeNutrition: true
      }
    });

    const recipe = response.data;

    const result = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes || 0,
      servings: recipe.servings || 1,
      sourceUrl: recipe.sourceUrl,
      summary: recipe.summary ? recipe.summary.replace(/<[^>]*>/g, '') : '',
      ingredients: (recipe.extendedIngredients || []).map(ing => ({
        id: ing.id,
        name: ing.name,
        original: ing.original,
        amount: ing.amount,
        unit: ing.unit,
        image: ing.image ? `https://spoonacular.com/cdn/ingredients_100x100/${ing.image}` : null
      })),
      instructions: recipe.instructions ? recipe.instructions.replace(/<[^>]*>/g, '') : '',
      analyzedInstructions: recipe.analyzedInstructions?.[0]?.steps?.map(step => ({
        number: step.number,
        step: step.step
      })) || [],
      nutrition: {
        calories: extractCalories(recipe.nutrition),
        protein: extractProtein(recipe.nutrition),
        nutrients: (recipe.nutrition?.nutrients || [])
          .filter(n => ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sugar', 'Sodium'].includes(n.name))
          .map(n => ({
            name: n.name,
            amount: Math.round(n.amount),
            unit: n.unit,
            percentOfDailyNeeds: Math.round(n.percentOfDailyNeeds || 0)
          }))
      },
      diets: recipe.diets || [],
      dishTypes: recipe.dishTypes || [],
      cuisines: recipe.cuisines || [],
      vegetarian: recipe.vegetarian || false,
      vegan: recipe.vegan || false,
      glutenFree: recipe.glutenFree || false,
      dairyFree: recipe.dairyFree || false
    };

    setCache(cacheKey, result);
    res.json(result);

  } catch (error) {
    console.error('Recipe detail error:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Recipe not found'
      });
    }

    if (allowSampleFallback && respondWithSampleDetail()) {
      console.warn('Recipe detail failed, serving offline dataset instead.');
      return;
    }

    if (error.message === 'SPOONACULAR_API_KEY not configured') {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Recipe API is not configured. Please set SPOONACULAR_API_KEY.'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch recipe',
      message: 'An error occurred while fetching recipe details'
    });
  }
};

module.exports = {
  searchRecipes,
  getRecipeDetail
};


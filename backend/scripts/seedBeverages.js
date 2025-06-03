const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Lê o arquivo plates.json
const beveragesPath = path.join(__dirname, '..', 'beverages.json');
const beverages = require(beveragesPath);

const API_URL = 'http://localhost:5000/api/beverages';

async function seedBeverages() {
  try {
    for (const beverage of beverages) {
      try {
        const response = await axios.post(API_URL, beverage);
        console.log(`✅ Bebida adicionada: ${beverage.name}`);
      } catch (error) {
        console.error(`❌ Erro ao adicionar bebida ${beverage.name}:`, error.response?.data?.message || error.message);
      }
      // Pequena pausa entre as requisições para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log('✅ Todos as bebidas foram processadas!');
  } catch (error) {
    console.error('❌ Erro ao processar as bebidas:', error);
  }
}

seedBeverages();

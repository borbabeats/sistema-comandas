const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Lê o arquivo plates.json
const dessertsPath = path.join(__dirname, '..', 'desserts.json');
const desserts = require(dessertsPath);

const API_URL = 'http://localhost:5000/api/desserts';

async function seedDesserts() {
  try {
    for (const dessert of desserts) {
      try {
        const response = await axios.post(API_URL, dessert);
        console.log(`✅ Sobremesa adicionada: ${dessert.name}`);
      } catch (error) {
        console.error(`❌ Erro ao adicionar sobremesa ${dessert.name}:`, error.response?.data?.message || error.message);
      }
      // Pequena pausa entre as requisições para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log('✅ Todos as sobremesas foram processadas!');
  } catch (error) {
    console.error('❌ Erro ao processar as sobremesas:', error);
  }
}

seedDesserts();

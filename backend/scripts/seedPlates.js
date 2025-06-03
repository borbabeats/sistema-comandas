const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Lê o arquivo plates.json
const platesPath = path.join(__dirname, '..', 'plates.json');
const plates = require(platesPath);

const API_URL = 'http://localhost:5000/api/plates';

async function seedPlates() {
  try {
    for (const plate of plates) {
      try {
        const response = await axios.post(API_URL, plate);
        console.log(`✅ Prato adicionado: ${plate.name}`);
      } catch (error) {
        console.error(`❌ Erro ao adicionar prato ${plate.name}:`, error.response?.data?.message || error.message);
      }
      // Pequena pausa entre as requisições para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    console.log('✅ Todos os pratos foram processados!');
  } catch (error) {
    console.error('❌ Erro ao processar os pratos:', error);
  }
}

seedPlates();

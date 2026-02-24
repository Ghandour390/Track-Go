import axios from 'axios';

// ⚠️ IMPORTANT : Si tu testes sur ton téléphone physique avec Expo Go,
// remplace "localhost" ou "10.0.2.2" par l'adresse IP locale de ton PC (ex: 192.168.1.15)
const BASE_URL = 'http://172.16.11.208:3009'; // Change cette IP !

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
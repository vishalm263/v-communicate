// This is a wrapper to help resolve module imports
import express from 'express';
import './src/index.js';

// This file doesn't do anything but ensure the express module is loaded first
console.log('Server wrapper initialized'); 
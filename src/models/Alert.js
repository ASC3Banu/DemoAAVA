/**
 * Alert Model
 * AI-Powered Logistics Monitoring System
 * 
 * Represents system alerts with escalation workflow and audit trail
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String
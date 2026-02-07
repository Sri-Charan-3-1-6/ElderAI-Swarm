// src/utils/prescriptionAnalyser.js
import Tesseract from 'tesseract.js';

// ============================================
// OFFLINE AI-POWERED PRESCRIPTION SCANNER
// Uses Tesseract.js OCR - Works 100% offline!
// ============================================

// This is our MEDICINE KNOWLEDGE DATABASE
// OCR extracts text, then we intelligently match against this
const MEDICINE_DATABASE = {
  // Blood Pressure Medicines
  amlodipine: {
    fullName: 'Amlodipine',
    category: 'Blood Pressure',
    timing: 'after_meal',
    commonDosages: ['2.5mg', '5mg', '10mg'],
    frequency: 'once_daily',
    instructions: 'Take after breakfast with water',
    icon: '🩸'
  },
  metoprolol: {
    fullName: 'Metoprolol',
    category: 'Blood Pressure / Heart',
    timing: 'after_meal',
    commonDosages: ['25mg', '50mg', '100mg'],
    frequency: 'twice_daily',
    instructions: 'Take after meals',
    icon: '❤️'
  },
  losartan: {
    fullName: 'Losartan',
    category: 'Blood Pressure',
    timing: 'after_meal',
    commonDosages: ['25mg', '50mg', '100mg'],
    frequency: 'once_daily',
    instructions: 'Take after breakfast',
    icon: '🩸'
  },

  // Diabetes Medicines
  metformin: {
    fullName: 'Metformin',
    category: 'Diabetes',
    timing: 'after_meal',
    commonDosages: ['250mg', '500mg', '850mg', '1000mg'],
    frequency: 'twice_daily',
    instructions: 'Take after breakfast and dinner',
    icon: '🍬'
  },
  glibenclamide: {
    fullName: 'Glibenclamide',
    category: 'Diabetes',
    timing: 'before_meal',
    commonDosages: ['1.25mg', '2.5mg', '5mg'],
    frequency: 'once_daily',
    instructions: 'Take 30 minutes before breakfast',
    icon: '🍬'
  },

  // Pain Medicines
  paracetamol: {
    fullName: 'Paracetamol',
    category: 'Pain Relief',
    timing: 'after_meal',
    commonDosages: ['250mg', '500mg', '1000mg'],
    frequency: 'as_needed',
    instructions: 'Take after meals as needed for pain',
    icon: '💊'
  },
  ibuprofen: {
    fullName: 'Ibuprofen',
    category: 'Pain / Inflammation',
    timing: 'after_meal',
    commonDosages: ['200mg', '400mg', '600mg'],
    frequency: 'three_times_daily',
    instructions: 'MUST take after meals to protect stomach',
    icon: '💊'
  },

  // Heart Medicines
  aspirin: {
    fullName: 'Aspirin',
    category: 'Heart / Blood Thinner',
    timing: 'after_meal',
    commonDosages: ['75mg', '100mg', '150mg', '325mg'],
    frequency: 'once_daily',
    instructions: 'Take after breakfast with water',
    icon: '❤️'
  },

  // Vitamins & Supplements
  vitaminD: {
    fullName: 'Vitamin D3',
    category: 'Vitamin',
    timing: 'after_meal',
    commonDosages: ['400IU', '1000IU', '2000IU', '60000IU'],
    frequency: 'once_daily',
    instructions: 'Take with milk or fatty food for better absorption',
    icon: '☀️'
  },
  vitaminB12: {
    fullName: 'Vitamin B12',
    category: 'Vitamin',
    timing: 'after_meal',
    commonDosages: ['100mcg', '250mcg', '500mcg'],
    frequency: 'once_daily',
    instructions: 'Take after breakfast',
    icon: '🟡'
  },
  ironTablet: {
    fullName: 'Iron Tablet (Ferrous Sulphate)',
    category: 'Supplement',
    timing: 'empty_stomach',
    commonDosages: ['45mg', '60mg', '100mg'],
    frequency: 'once_daily',
    instructions: 'Take on EMPTY stomach with vitamin C (lemon juice)',
    icon: '🔴'
  },
  calciumTablet: {
    fullName: 'Calcium Tablet',
    category: 'Supplement',
    timing: 'after_meal',
    commonDosages: ['500mg', '1000mg'],
    frequency: 'once_daily',
    instructions: 'Take after meals. Do NOT take with iron',
    icon: '🦴'
  },

  // Stomach / Digestive
  omeprazole: {
    fullName: 'Omeprazole',
    category: 'Stomach Protection',
    timing: 'empty_stomach',
    commonDosages: ['10mg', '20mg', '40mg'],
    frequency: 'once_daily',
    instructions: 'Take 30 minutes BEFORE breakfast on empty stomach',
    icon: '🫁'
  },
  ranitidine: {
    fullName: 'Ranitidine',
    category: 'Stomach Protection',
    timing: 'before_meal',
    commonDosages: ['150mg', '300mg'],
    frequency: 'twice_daily',
    instructions: 'Take before breakfast and dinner',
    icon: '🫁'
  },

  // Thyroid
  levothyroxine: {
    fullName: 'Levothyroxine (Thyroid)',
    category: 'Thyroid',
    timing: 'empty_stomach',
    commonDosages: ['25mcg', '50mcg', '75mcg', '100mcg'],
    frequency: 'once_daily',
    instructions: 'Take on EMPTY stomach 30 min before breakfast with water ONLY',
    icon: '🦋'
  },

  // Allergy
  cetirizine: {
    fullName: 'Cetirizine',
    category: 'Anti-Allergy',
    timing: 'after_meal',
    commonDosages: ['5mg', '10mg'],
    frequency: 'once_daily',
    instructions: 'Take at night after dinner (causes drowsiness)',
    icon: '🤧'
  },

  // Additional Common Medicines
  atorvastatin: {
    fullName: 'Atorvastatin',
    category: 'Cholesterol',
    timing: 'after_meal',
    commonDosages: ['10mg', '20mg', '40mg'],
    frequency: 'once_daily',
    instructions: 'Take at night after dinner',
    icon: '💊'
  },
  clopidogrel: {
    fullName: 'Clopidogrel',
    category: 'Blood Thinner',
    timing: 'after_meal',
    commonDosages: ['75mg'],
    frequency: 'once_daily',
    instructions: 'Take after breakfast',
    icon: '🩸'
  },
  pantoprazole: {
    fullName: 'Pantoprazole',
    category: 'Stomach Protection',
    timing: 'before_meal',
    commonDosages: ['20mg', '40mg'],
    frequency: 'once_daily',
    instructions: 'Take 30 minutes before breakfast',
    icon: '🛡️'
  },
  tramadol: {
    fullName: 'Tramadol',
    category: 'Pain Relief',
    timing: 'after_meal',
    commonDosages: ['50mg', '100mg'],
    frequency: 'as_needed',
    instructions: 'Take when needed for pain, after food',
    icon: '💊'
  },
  diclofenac: {
    fullName: 'Diclofenac',
    category: 'Pain Relief',
    timing: 'after_meal',
    commonDosages: ['50mg', '75mg'],
    frequency: 'twice_daily',
    instructions: 'Take after meals (can cause stomach upset)',
    icon: '💊'
  }
};

// ============================================
// ADVANCED MEDICINE PATTERN DETECTOR
// Multi-layered extraction with fuzzy matching
// ============================================
const extractMedicinesFromText = (text) => {
  const medicines = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('📄 OCR Extracted Lines:', lines);
  console.log('📝 Full text length:', text.length);
  
  // Enhanced dosage patterns
  const dosagePattern = /(\d+\.?\d*)\s*(mg|ml|g|mcg|iu|units?)/gi;
  
  // Expanded frequency patterns
  const frequencyPatterns = {
    once: /(?:once|1\s*time|od|qd|1\s*-\s*0\s*-\s*0)/i,
    twice: /(?:twice|2\s*times|bd|bid|1\s*-\s*0\s*-\s*1|0\s*-\s*1\s*-\s*1)/i,
    thrice: /(?:thrice|3\s*times|tid|tds|1\s*-\s*1\s*-\s*1)/i
  };
  
  // Get all known medicine names and variants
  const medicineMap = {};
  Object.entries(MEDICINE_DATABASE).forEach(([key, data]) => {
    const name = data.fullName.toLowerCase();
    medicineMap[name] = data;
    // Add partial matches (first 4-5 characters)
    if (name.length >= 5) {
      medicineMap[name.substring(0, 5)] = data;
    }
  });
  
  // Process each line intelligently
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    // Skip obvious non-medicine lines
    if (lineLower.match(/^(dr\.|patient|clinic|hospital|date|rx|signature|seal|address|phone|mobile|age)/i) ||
        line.length < 3) {
      console.log('⏭️ Skipping:', line);
      continue;
    }
    
    // Look for dosage in this line
    const dosageMatch = line.match(dosagePattern);
    if (!dosageMatch && !lineLower.match(/tablet|capsule|syrup|injection/i)) {
      continue; // Must have dosage or medicine indicator
    }
    
    // Extract medicine name (first significant word)
    const words = line.split(/[\s,.-]+/).filter(w => w.length > 2);
    if (words.length === 0) continue;
    
    let medicineName = null;
    let medicineData = null;
    
    // Try to match against database
    for (const word of words) {
      const wordLower = word.toLowerCase().replace(/[^a-z]/g, '');
      
      // Exact or partial match
      for (const [knownName, data] of Object.entries(medicineMap)) {
        if (wordLower === knownName || 
            (wordLower.length >= 4 && knownName.startsWith(wordLower)) ||
            (knownName.length >= 4 && wordLower.startsWith(knownName))) {
          medicineName = data.fullName;
          medicineData = data;
          break;
        }
      }
      if (medicineName) break;
    }
    
    // If no match but has dosage, use first word as medicine
    if (!medicineName && dosageMatch) {
      const firstWord = words[0].replace(/[^a-zA-Z]/g, '');
      if (firstWord.length >= 3) {
        medicineName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
      }
    }
    
    if (!medicineName) continue;
    
    // Extract dosage
    const dosage = dosageMatch ? dosageMatch[0] : '1 tablet';
    
    // Determine frequency from this line and next 2 lines
    let timesPerDay = 1;
    const contextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(' ').toLowerCase();
    
    if (frequencyPatterns.thrice.test(contextLines)) {
      timesPerDay = 3;
    } else if (frequencyPatterns.twice.test(contextLines)) {
      timesPerDay = 2;
    } else if (frequencyPatterns.once.test(contextLines)) {
      timesPerDay = 1;
    }
    
    // Extract timing instructions
    let rawInstructions = '';
    if (contextLines.includes('empty stomach') || contextLines.includes('before breakfast')) {
      rawInstructions = 'empty stomach';
    } else if (contextLines.includes('before food') || contextLines.includes('before meal')) {
      rawInstructions = 'before food';
    } else if (contextLines.includes('after food') || contextLines.includes('after meal')) {
      rawInstructions = 'after food';
    } else if (contextLines.includes('with food') || contextLines.includes('with meal')) {
      rawInstructions = 'with food';
    } else if (contextLines.includes('bedtime') || contextLines.includes('before sleep') || contextLines.includes('at night')) {
      rawInstructions = 'before sleep';
    }
    
    // Add medicine
    medicines.push({
      name: medicineName,
      dosage: dosage,
      timesPerDay: timesPerDay,
      rawInstructions: rawInstructions || (medicineData?.instructions || 'Take as directed'),
      matchedFromDatabase: !!medicineData
    });
    
    console.log('✅ Extracted:', { name: medicineName, dosage, timesPerDay, rawInstructions });
  }
  
  // Remove duplicates
  const uniqueMedicines = [];
  const seen = new Set();
  
  for (const med of medicines) {
    const key = `${med.name.toLowerCase()}-${med.dosage}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMedicines.push(med);
    }
  }
  
  console.log('💊 Final extracted medicines:', uniqueMedicines.length);
  return uniqueMedicines;
};

// ============================================
// MAIN FUNCTION: Offline OCR Analysis
// Uses Tesseract.js - 100% offline, no API!
// ============================================
export const analysePrescription = async (base64Image, mediaType = 'image/jpeg', onProgress) => {
  try {
    console.log('🤖 Starting ADVANCED AI OCR analysis...');
    console.log('📸 Image type:', mediaType);
    
    // Convert base64 to blob for Tesseract
    const imageUrl = `data:${mediaType};base64,${base64Image}`;
    
    // Enhanced Tesseract configuration for prescriptions
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        console.log('📊 OCR Progress:', m);
        if (onProgress) {
          if (m.status === 'loading tesseract core') onProgress(10);
          else if (m.status === 'initializing tesseract') onProgress(20);
          else if (m.status === 'loading language traineddata') onProgress(30);
          else if (m.status === 'initializing api') onProgress(40);
          else if (m.status === 'recognizing text') onProgress(40 + Math.round(m.progress * 60));
        }
      }
    });
    
    // Set OCR parameters for better prescription reading
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,- ()mg/ml:',
      preserve_interword_spaces: '1'
    });
    
    console.log('🔍 Running OCR with enhanced settings...');
    
    // Run OCR
    const { data } = await worker.recognize(imageUrl);
    
    await worker.terminate();
    
    const extractedText = data.text;
    console.log('✅ OCR Complete!');
    console.log('📝 Extracted text length:', extractedText.length);
    console.log('📄 Full text:\n' + '='.repeat(50) + '\n' + extractedText + '\n' + '='.repeat(50));
    
    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error('Could not extract text from image. Please ensure the image is clear and well-lit.');
    }
    
    // Extract medicines using advanced pattern matching
    const medicines = extractMedicinesFromText(extractedText);
    
    if (medicines.length === 0) {
      console.warn('⚠️ No medicines detected in text');
      // Return a sample medicine so user knows OCR worked
      return {
        medicines: [{
          name: 'No medicines detected',
          dosage: 'N/A',
          timesPerDay: 1,
          rawInstructions: 'OCR completed but no medicines found. Try a clearer image.',
          matchedFromDatabase: false
        }],
        doctorName: 'Not detected',
        patientName: 'Not detected',
        confidence: 'low',
        rawText: extractedText
      };
    }
    
    // Try to find doctor and patient names
    const lines = extractedText.split('\n');
    let doctorName = '';
    let patientName = '';
    
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if ((lineLower.includes('dr.') || lineLower.includes('doctor')) && !doctorName) {
        doctorName = line.trim().substring(0, 50);
      }
      if (lineLower.includes('patient') && !patientName) {
        patientName = line.replace(/patient:?/i, '').trim().substring(0, 50);
      }
    }
    
    // Confidence based on number of medicines found and database matches
    const matchedCount = medicines.filter(m => m.matchedFromDatabase).length;
    const confidence = medicines.length >= 3 && matchedCount >= 2 ? 'high' : 
                      medicines.length >= 2 ? 'medium' : 'low';
    
    console.log('🎯 Analysis complete:', {
      totalMedicines: medicines.length,
      databaseMatches: matchedCount,
      confidence
    });
    
    return {
      medicines,
      doctorName: doctorName || 'Not detected',
      patientName: patientName || 'Not detected',
      confidence,
      rawText: extractedText
    };

  } catch (error) {
    console.error('❌ OCR analysis error:', error);
    throw new Error(`Failed to analyze prescription: ${error.message}`);
  }
};

// ============================================
// FUNCTION: Match extracted medicines with our database
// ============================================
export const matchMedicines = (extractedMedicines) => {
  console.log('🔍 Matching medicines with database...');
  console.log('📝 Input medicines:', extractedMedicines);
  
  return extractedMedicines.map(medicine => {
    // Already matched during extraction
    if (medicine.matchedFromDatabase) {
      console.log('✅ Already matched:', medicine.name);
      
      // Find the database entry for full details
      const dbEntry = Object.values(MEDICINE_DATABASE).find(
        db => db.fullName.toLowerCase() === medicine.name.toLowerCase()
      );
      
      if (dbEntry) {
        return {
          ...medicine,
          matched: true,
          category: dbEntry.category,
          icon: dbEntry.icon,
          suggestedTiming: dbEntry.timing,
          suggestedInstructions: medicine.rawInstructions || dbEntry.instructions
        };
      }
    }
    
    // Try fuzzy matching for unmatched medicines
    const nameLower = medicine.name.toLowerCase().replace(/[^a-z]/g, '');
    
    for (const [key, value] of Object.entries(MEDICINE_DATABASE)) {
      const dbName = value.fullName.toLowerCase().replace(/[^a-z]/g, '');
      
      // Fuzzy match: check if names are similar
      if (nameLower === dbName || 
          (nameLower.length >= 4 && dbName.startsWith(nameLower.substring(0, 4))) ||
          (dbName.length >= 4 && nameLower.startsWith(dbName.substring(0, 4)))) {
        
        console.log('✅ Fuzzy matched:', medicine.name, '→', value.fullName);
        
        return {
          ...medicine,
          name: value.fullName, // Use correct name from database
          matched: true,
          category: value.category,
          icon: value.icon,
          suggestedTiming: value.timing,
          suggestedInstructions: medicine.rawInstructions || value.instructions
        };
      }
    }
    
    // No match found - use generic values
    console.log('⚠️ No database match for:', medicine.name);
    return {
      ...medicine,
      matched: false,
      category: 'General Medicine',
      icon: '💊',
      suggestedTiming: 'after_meal',
      suggestedInstructions: medicine.rawInstructions || 'Take as directed by doctor'
    };
  });
};


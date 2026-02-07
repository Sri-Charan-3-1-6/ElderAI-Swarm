import React, { useState, useRef } from 'react';
import { X, Camera, Upload, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { analysePrescription, matchMedicines } from '../../utils/prescriptionAnalyser.js';
import { createMedicinePlan, convertToMedicinesFormat } from '../../utils/timingPlanner.js';
import { getItem, storageKeys, updateMedicines } from '../../utils/storageUtils.js';

/**
 * PrescriptionScanner Component
 * Allows elderly users to scan or upload prescription images
 * Large, friendly UI optimized for seniors
 */
const PrescriptionScanner = ({ onClose, onAnalysisComplete }) => {
  // State management
  const [screen, setScreen] = useState('main'); // 'main', 'preview', 'loading', 'results', 'success'
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for hidden file inputs
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  // TEST MODE: Generate demo prescription
  const handleTestDemo = async () => {
    console.log('🧪 Running TEST MODE with demo prescription...');
    
    setScreen('loading');
    setLoadingStep(0);
    setErrorMessage('');
    
    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingStep(1);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingStep(2);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate demo medicines
    const demoMedicines = [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        timesPerDay: 1,
        rawInstructions: 'Take after breakfast',
        matchedFromDatabase: true
      },
      {
        name: 'Metformin',
        dosage: '500mg',
        timesPerDay: 2,
        rawInstructions: 'Take after meals',
        matchedFromDatabase: true
      },
      {
        name: 'Paracetamol',
        dosage: '500mg',
        timesPerDay: 3,
        rawInstructions: 'Take when needed for pain',
        matchedFromDatabase: true
      }
    ];
    
    const matchedMedicines = matchMedicines(demoMedicines);
    const medicinePlan = createMedicinePlan(matchedMedicines);
    
    setAnalysisResult({
      medicines: matchedMedicines,
      doctorName: 'Dr. Demo',
      patientName: 'Test Patient',
      confidence: 'high',
      plan: medicinePlan
    });
    
    setScreen('results');
  };

  // Convert image file to base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove the "data:image/jpeg;base64," prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle camera capture
  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setScreen('preview');
    }
  };

  // Handle file upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      setScreen('preview');
    }
  };

  // Open camera
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  // Open file picker
  const openUpload = () => {
    uploadInputRef.current?.click();
  };

  // Handle analyse button
  const handleAnalyse = async () => {
    try {
      setScreen('loading');
      setLoadingStep(0);
      setOcrProgress(0);
      setErrorMessage('');

      // Show first step
      setLoadingStep(0);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Convert to base64
      const base64Image = await convertImageToBase64(selectedImage);
      
      // Detect image type
      const mediaType = selectedImage.type || 'image/jpeg';

      console.log('🚀 Starting prescription analysis...');
      console.log('📸 Image size:', selectedImage.size, 'bytes');
      console.log('📝 Image type:', mediaType);

      // Show second step
      setLoadingStep(1);

      // Call OFFLINE OCR to analyse prescription
      const rawResult = await analysePrescription(base64Image, mediaType, (progress) => {
        setOcrProgress(progress);
      });

      // Show third step
      setLoadingStep(2);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Match medicines with our database
      const matchedMedicines = matchMedicines(rawResult.medicines);

      // Create smart medicine plan (timing schedule)
      const medicinePlan = createMedicinePlan(matchedMedicines);

      // Save result
      setAnalysisResult({
        ...rawResult,
        medicines: matchedMedicines,
        plan: medicinePlan
      });
      
      setScreen('results');

      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete({
          medicines: matchedMedicines,
          plan: medicinePlan
        });
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setErrorMessage(error.message || 'Failed to analyze prescription');
      alert(`Failed to analyse prescription: ${error.message}\n\nTips for better results:\n• Use clear, well-lit images\n• Ensure text is readable\n• Try the TEST button to see how it works`);
      setScreen('preview');
    }
  };

  // Take another photo
  const handleTakeAnother = () => {
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setAnalysisResult(null);
    setScreen('main');
  };

  // Save to Medicine Buddy
  const handleSaveToMedicineBuddy = () => {
    try {
      if (!analysisResult || !analysisResult.plan) {
        alert('No medicines to save');
        return;
      }

      const newMedicines = convertToMedicinesFormat(analysisResult.plan.timeline);
      const existingMedicines = getItem(storageKeys.medicines, []);

      // Check for duplicates
      const duplicateNames = [];
      newMedicines.forEach(newMed => {
        const medName = newMed.name.toLowerCase().split(' ')[0];
        const isDuplicate = existingMedicines.some(existing =>
          existing.name.toLowerCase().includes(medName)
        );
        if (isDuplicate) {
          duplicateNames.push(newMed.name);
        }
      });

      if (duplicateNames.length > 0) {
        const confirmMessage = `Some medicines already exist in your list:\n${duplicateNames.join('\n')}\n\nDo you want to add them anyway?`;
        if (!confirm(confirmMessage)) {
          return;
        }
      }

      // Save all medicines
      updateMedicines((list) => {
        return [...(list || []), ...newMedicines];
      });

      setSaveMessage(`Successfully added ${newMedicines.length} medicine${newMedicines.length !== 1 ? 's' : ''} to Medicine Buddy!`);
      setScreen('success');

      // Notify parent
      if (onAnalysisComplete) {
        onAnalysisComplete({
          medicines: analysisResult.medicines,
          plan: analysisResult.plan,
          saved: true
        });
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save medicines. Please try again.');
    }
  };

  // Go back
  const handleBack = () => {
    if (screen === 'preview') {
      handleTakeAnother();
    } else if (screen === 'results') {
      setScreen('main');
    }
  };

  // Render main screen
  const renderMainScreen = () => (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onClose} style={styles.closeButton}>
          <X size={32} />
        </button>
        <h2 style={styles.title}>📷 Scan Prescription</h2>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Camera Button */}
        <button onClick={openCamera} style={styles.cameraButton}>
          <Camera size={48} />
          <div style={styles.buttonText}>
            <div style={styles.buttonTitle}>Take Photo</div>
            <div style={styles.buttonSubtitle}>(Tap to open camera)</div>
          </div>
        </button>

        {/* Upload Button */}
        <button onClick={openUpload} style={styles.uploadButton}>
          <Upload size={48} />
          <div style={styles.buttonText}>
            <div style={styles.buttonTitle}>Upload Image</div>
            <div style={styles.buttonSubtitle}>(From phone gallery)</div>
          </div>
        </button>

        {/* TEST Button */}
        <button onClick={handleTestDemo} style={styles.testButton}>
          <span style={{ fontSize: '32px' }}>🧪</span>
          <div style={styles.buttonText}>
            <div style={styles.buttonTitle}>TEST (Demo Mode)</div>
            <div style={styles.buttonSubtitle}>(See how it works)</div>
          </div>
        </button>

        {/* Tips Card */}
        <div style={styles.tipsCard}>
          <div style={styles.tipsTitle}>� Offline AI Scanner</div>
          <ul style={styles.tipsList}>
            <li>✅ Works without internet</li>
            <li>🔒 100% private & secure</li>
            <li>💡 Keep paper flat, good lighting</li>
            <li>📸 Clear & readable text</li>
          </ul>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
        ref={cameraInputRef}
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
        ref={uploadInputRef}
      />
    </div>
  );

  // Render preview screen
  const renderPreviewScreen = () => (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>
          <ArrowLeft size={28} /> Back
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Image Preview */}
        {imagePreviewUrl && (
          <img
            src={imagePreviewUrl}
            alt="Prescription preview"
            style={styles.previewImage}
          />
        )}

        {/* Analyse Button */}
        <button onClick={handleAnalyse} style={styles.analyseButton}>
          <span style={{ fontSize: '32px' }}>🔍</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold' }}>Analyse Prescription</span>
        </button>

        {/* Take Another Button */}
        <button onClick={handleTakeAnother} style={styles.takeAnotherButton}>
          🔄 Take Another
        </button>
      </div>
    </div>
  );

  // Render loading screen
  const renderLoadingScreen = () => {
    const steps = [
      '📸 Processing image...',
      `🤖 Reading text... ${ocrProgress}%`,
      '💊 Creating medicine schedule...'
    ];

    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          {/* Spinner */}
          <div style={styles.spinnerWrapper}>
            <Loader2 size={80} style={styles.spinner} />
          </div>

          {/* Main message */}
          <h3 style={styles.loadingTitle}>🚀 Offline AI Reading...</h3>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
            No internet needed! 100% private & secure
          </p>

          {/* Progress bar for OCR */}
          {loadingStep === 1 && (
            <div style={styles.progressBarContainer}>
              <div style={{...styles.progressBar, width: `${ocrProgress}%`}} />
            </div>
          )}

          {/* Loading steps */}
          <div style={styles.stepsContainer}>
            {steps.map((step, index) => (
              <div
                key={index}
                style={{
                  ...styles.loadingStep,
                  opacity: index <= loadingStep ? 1 : 0.3,
                  transform: index <= loadingStep ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.5s ease'
                }}
              >
                {index < loadingStep && (
                  <CheckCircle size={24} style={{ color: '#28a745', marginRight: '10px' }} />
                )}
                {index === loadingStep && (
                  <Loader2 size={24} style={{ ...styles.smallSpinner, marginRight: '10px' }} />
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render results screen
  const renderResultsScreen = () => {
    if (!analysisResult) return null;

    const { medicines, doctorName, patientName, confidence, plan } = analysisResult;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={32} />
          </button>
          <h2 style={styles.title}>✅ Prescription Read!</h2>
        </div>
        
        <div style={styles.content}>
          {/* Confidence Badge */}
          {confidence && (
            <div style={{
              ...styles.confidenceBadge,
              backgroundColor: confidence === 'high' ? '#d4edda' : confidence === 'medium' ? '#fff3cd' : '#f8d7da',
              color: confidence === 'high' ? '#155724' : confidence === 'medium' ? '#856404' : '#721c24'
            }}>
              Confidence: {confidence.toUpperCase()}
            </div>
          )}

          {/* Doctor and Patient Info */}
          {(doctorName || patientName) && (
            <div style={styles.infoCard}>
              {doctorName && <div style={styles.infoText}>👨‍⚕️ Dr. {doctorName}</div>}
              {patientName && <div style={styles.infoText}>👤 Patient: {patientName}</div>}
            </div>
          )}

          {/* SMART DAILY TIMELINE */}
          {plan && plan.timeline && (
            <>
              <h3 style={styles.sectionTitle}>📅 Your Smart Daily Schedule</h3>
              
              {/* Warnings if any */}
              {plan.warnings && plan.warnings.length > 0 && (
                <div style={styles.warningsCard}>
                  {plan.warnings.map((warning, idx) => (
                    <div key={idx} style={styles.warningText}>{warning}</div>
                  ))}
                </div>
              )}

              {/* Timeline */}
              <div style={styles.timelineContainer}>
                {plan.timeline.map((slot, index) => (
                  <div key={index} style={styles.timeSlot}>
                    <div style={styles.timeSlotHeader}>
                      <span style={styles.timeSlotTime}>{slot.time}</span>
                      <span style={styles.timeSlotLabel}>{slot.label}</span>
                    </div>
                    <div style={styles.timeSlotMedicines}>
                      {slot.medicines.map((med, medIdx) => (
                        <div key={medIdx} style={styles.timelineMedicine}>
                          <span style={styles.timelineMedicineIcon}>{med.icon}</span>
                          <div style={styles.timelineMedicineInfo}>
                            <div style={styles.timelineMedicineName}>
                              {med.name} - {med.dosage}
                            </div>
                            {med.rule && med.rule.warning && (
                              <div style={styles.timelineMedicineWarning}>
                                ⚠️ {med.rule.warning}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Medicines List */}
          <h3 style={styles.sectionTitle}>💊 Medicine Details ({medicines.length})</h3>
          
          <div style={styles.medicinesList}>
            {medicines.map((med, index) => (
              <div key={index} style={styles.medicineCard}>
                <div style={styles.medicineHeader}>
                  <span style={styles.medicineIcon}>{med.icon}</span>
                  <div style={styles.medicineInfo}>
                    <div style={styles.medicineName}>{med.name}</div>
                    <div style={styles.medicineCategory}>{med.category}</div>
                  </div>
                  {med.matched && (
                    <span style={styles.matchedBadge}>✓ Matched</span>
                  )}
                </div>

                <div style={styles.medicineDetails}>
                  <div style={styles.detailRow}>
                    <strong>Dosage:</strong> {med.dosage}
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Frequency:</strong> {med.timesPerDay} time{med.timesPerDay !== 1 ? 's' : ''} per day
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Timing:</strong> {med.suggestedTiming.replace('_', ' ')}
                  </div>
                  <div style={styles.instructionsBox}>
                    💡 {med.suggestedInstructions}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={styles.actionButtons}>
            <button onClick={handleSaveToMedicineBuddy} style={styles.saveButton}>
              ✅ Add All to Medicine Buddy
            </button>
            <button onClick={handleTakeAnother} style={styles.secondaryButton}>
              📷 Scan Another
            </button>
            <button onClick={onClose} style={styles.tertiaryButton}>
              ← Back
            </button>
          </div>

          {/* Additional Info */}
          <div style={styles.tipCard}>
            <p style={styles.tipText}>
              ℹ️ These medicines have been identified from your prescription. 
              Please consult with your doctor before taking any medication.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render success screen
  const renderSuccessScreen = () => {
    const nextMedicine = analysisResult?.plan?.timeline[0]?.medicines[0];
    
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          {/* Success Icon */}
          <div style={styles.successIcon}>🎉</div>
          
          {/* Success Message */}
          <h2 style={styles.successTitle}>Success!</h2>
          <p style={styles.successMessage}>{saveMessage}</p>

          {/* Next Medicine Info */}
          {nextMedicine && (
            <div style={styles.nextMedicineCard}>
              <div style={styles.nextMedicineLabel}>Your next medicine:</div>
              <div style={styles.nextMedicineName}>
                {nextMedicine.icon} {nextMedicine.name}
              </div>
              <div style={styles.nextMedicineTime}>
                at {analysisResult.plan.timeline[0].time}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <button onClick={onClose} style={styles.analyseButton}>
            Go to Medicine Buddy →
          </button>
          
          <button onClick={handleTakeAnother} style={{...styles.secondaryButton, marginTop: '15px'}}>
            Scan Another Prescription
          </button>
        </div>
      </div>
    );
  };

  // Render based on current screen
  return (
    <>
      {screen === 'main' && renderMainScreen()}
      {screen === 'preview' && renderPreviewScreen()}
      {screen === 'loading' && renderLoadingScreen()}
      {screen === 'results' && renderResultsScreen()}
      {screen === 'success' && renderSuccessScreen()}
    </>
  );
};

// Styles
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f9fa',
    zIndex: 1000,
    overflow: 'auto'
  },
  header: {
    padding: '20px',
    backgroundColor: '#6f42c1',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center'
  },
  content: {
    padding: '30px 20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  cameraButton: {
    width: '100%',
    height: '120px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  uploadButton: {
    width: '100%',
    height: '120px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(0, 123, 255, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  testButton: {
    width: '100%',
    height: '100px',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: '3px dashed white',
    borderRadius: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    fontSize: '22px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  buttonText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  buttonTitle: {
    fontSize: '24px',
    fontWeight: 'bold'
  },
  buttonSubtitle: {
    fontSize: '16px',
    opacity: 0.9
  },
  tipsCard: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '30px'
  },
  tipsTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#856404'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '25px',
    fontSize: '18px',
    color: '#856404',
    lineHeight: '1.8'
  },
  previewImage: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'contain',
    borderRadius: '15px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    marginBottom: '30px',
    backgroundColor: '#fff'
  },
  analyseButton: {
    width: '100%',
    height: '80px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '15px',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
    transition: 'transform 0.2s'
  },
  takeAnotherButton: {
    width: '100%',
    height: '60px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '40px 20px'
  },
  spinnerWrapper: {
    marginBottom: '40px'
  },
  spinner: {
    animation: 'spin 1.5s linear infinite',
    color: '#6f42c1'
  },
  loadingTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '40px',
    textAlign: 'center'
  },
  stepsContainer: {
    width: '100%',
    maxWidth: '500px'
  },
  loadingStep: {
    fontSize: '20px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    color: '#333'
  },
  smallSpinner: {
    animation: 'spin 1s linear infinite',
    color: '#6f42c1'
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: '500px',
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '15px',
    overflow: 'hidden',
    marginBottom: '30px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6f42c1',
    transition: 'width 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px',
    borderRadius: '15px'
  },
  placeholderMessage: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  // Results screen styles
  confidenceBadge: {
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px'
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    border: '2px solid #2196f3',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px'
  },
  infoText: {
    fontSize: '18px',
    color: '#0d47a1',
    marginBottom: '8px',
    fontWeight: '500'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    marginTop: '10px'
  },
  medicinesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px'
  },
  medicineCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    border: '2px solid #e0e0e0'
  },
  medicineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  },
  medicineIcon: {
    fontSize: '40px'
  },
  medicineInfo: {
    flex: 1
  },
  medicineName: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  medicineCategory: {
    fontSize: '16px',
    color: '#666',
    fontWeight: '500'
  },
  matchedBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  medicineDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  detailRow: {
    fontSize: '18px',
    color: '#555',
    lineHeight: '1.6'
  },
  instructionsBox: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '10px',
    padding: '15px',
    fontSize: '16px',
    color: '#856404',
    marginTop: '10px',
    lineHeight: '1.6'
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px'
  },
  secondaryButton: {
    width: '100%',
    height: '70px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '22px',
    fontWeight: 'bold',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  tipCard: {
    backgroundColor: '#e7f3ff',
    border: '2px solid #2196f3',
    borderRadius: '12px',
    padding: '15px',
    marginTop: '10px'
  },
  tipText: {
    fontSize: '16px',
    color: '#0d47a1',
    margin: 0,
    lineHeight: '1.6'
  },
  // Timeline styles
  warningsCard: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '20px'
  },
  warningText: {
    fontSize: '16px',
    color: '#856404',
    marginBottom: '8px',
    fontWeight: '500'
  },
  timelineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px'
  },
  timeSlot: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    border: '2px solid #e0e0e0'
  },
  timeSlotHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '15px',
    paddingBottom: '12px',
    borderBottom: '2px solid #f0f0f0'
  },
  timeSlotTime: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#6f42c1',
    minWidth: '90px'
  },
  timeSlotLabel: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  timeSlotMedicines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  timelineMedicine: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #dee2e6'
  },
  timelineMedicineIcon: {
    fontSize: '32px',
    flexShrink: 0
  },
  timelineMedicineInfo: {
    flex: 1
  },
  timelineMedicineName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px'
  },
  timelineMedicineWarning: {
    fontSize: '14px',
    color: '#856404',
    backgroundColor: '#fff3cd',
    padding: '8px 12px',
    borderRadius: '6px',
    marginTop: '8px',
    border: '1px solid #ffc107'
  },
  // Success screen styles
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    padding: '40px 20px',
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '100px',
    marginBottom: '20px',
    animation: 'bounce 0.5s ease-in-out'
  },
  successTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: '15px'
  },
  successMessage: {
    fontSize: '20px',
    color: '#555',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  nextMedicineCard: {
    backgroundColor: '#e7f3ff',
    border: '2px solid #2196f3',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    width: '100%',
    maxWidth: '400px'
  },
  nextMedicineLabel: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '10px'
  },
  nextMedicineName: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#0d47a1',
    marginBottom: '8px'
  },
  nextMedicineTime: {
    fontSize: '22px',
    color: '#2196f3',
    fontWeight: '600'
  },
  saveButton: {
    width: '100%',
    height: '80px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '24px',
    fontWeight: 'bold',
    boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
    transition: 'transform 0.2s',
    marginBottom: '15px'
  },
  tertiaryButton: {
    width: '100%',
    height: '60px',
    backgroundColor: 'transparent',
    color: '#666',
    border: '2px solid #ccc',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'transform 0.2s'
  }
};

// Add CSS animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
`;
document.head.appendChild(styleSheet);

export default PrescriptionScanner;


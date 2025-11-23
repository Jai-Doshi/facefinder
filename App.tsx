import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Scan, Globe, Image as ImageIcon } from 'lucide-react';
import Logo from './components/Logo';
import { GradientButton } from './components/UIComponents';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Results from './pages/Results';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/admin/Dashboard.tsx';
import AllImages from './pages/admin/AllImages.tsx';
import { AppState, Tab, PhotoResult, UserRole } from './types';
import { MOCK_GALLERY_DATA, MOCK_ADMIN_ALL_IMAGES } from './constants';
import { ToastContainer, useToast, showToast } from './components/Toast';
import { getProfile } from './services/apiService';
import { APP_TEXT_GRADIENT } from './constants';
import ServerStatus from './components/ServerStatus';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [userRole, setUserRole] = useState<UserRole>('user');
  
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [showSignUp, setShowSignUp] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [hasShownWelcomeToast, setHasShownWelcomeToast] = useState(false);
  
  // Theme State
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });
  
  // Specific Page States
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [savedImageIds, setSavedImageIds] = useState<string[]>([]);
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Admin Data States
  const [allImages, setAllImages] = useState<PhotoResult[]>(MOCK_ADMIN_ALL_IMAGES);
  
  // Toast system
  const { toasts, removeToast } = useToast();
  
  // Theme management
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkTheme) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // Update favicon based on theme
    updateFavicon(isDarkTheme);
  }, [isDarkTheme]);
  
  const updateFavicon = (dark: boolean) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());
    
    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = dark ? '/favicon.png' : '/favicon.png';
    link.id = 'favicon';
    document.getElementsByTagName('head')[0].appendChild(link);
  };
  
  const handleThemeToggle = () => {
    setIsDarkTheme(prev => !prev);
    showToast(`Switched to ${!isDarkTheme ? 'dark' : 'light'} theme`, 'success');
  };

  const loadSavedImageIds = async () => {
    if (!authToken) return;
    try {
      const { getSavedImageIds } = await import('./services/apiService');
      const ids = await getSavedImageIds(authToken);
      setSavedImageIds(ids);
    } catch (error) {
      console.error('Failed to load saved image IDs:', error);
    }
  };

  // Check authentication on mount and load user profile
  useEffect(() => {
    if (authToken) {
      setIsAuthenticated(true);
      // Load user profile to get admin status and profile image
      getProfile(authToken)
        .then(response => {
          setUserData(response.user);
          setUserIsAdmin(response.user.is_admin || false);
          if (response.user.is_admin) {
            setUserRole('admin');
            setActiveTab('dashboard'); // Admin starts at dashboard
          } else {
            setUserRole('user');
            setActiveTab('home'); // User starts at home
          }
          // Set profile image URL if available
          if (response.user.profile_image) {
            import('./services/apiService').then(({ getProfileImageUrl }) => {
              setUserProfileImage(getProfileImageUrl(response.user.profile_image));
            });
          }
          // Load saved image IDs
          loadSavedImageIds();
          
          // Show welcome toast when returning user logs in (only once per session)
          if (!hasShownWelcomeToast) {
            const userName = response.user.name || 'User';
            showToast(
              <>
                Welcome <span className={APP_TEXT_GRADIENT}>{userName}</span>
              </>,
              'success'
            );
            setHasShownWelcomeToast(true);
          }
        })
        .catch(() => {
          // Token might be invalid, clear it
          localStorage.removeItem('authToken');
          setAuthToken(null);
          setIsAuthenticated(false);
        });
    }
  }, [authToken]);

  // Simulating route check on mount
  useEffect(() => {
    // In a real app, check router. Here we check if pathname contains 'admin' for simulation
    if (window.location.pathname.includes('admin')) {
        setUserRole('admin');
        setActiveTab('dashboard');
    }
  }, []);

  // Authentication handlers
  const handleSignInSuccess = async (token: string, user: any) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setUserIsAdmin(user.is_admin || false);
    setIsAuthenticated(true);
    setShowSignUp(false);
    // Set role and default tab based on admin status
    if (user.is_admin) {
      setUserRole('admin');
      setActiveTab('dashboard'); // Admin starts at dashboard
    } else {
      setUserRole('user');
      setActiveTab('home'); // User starts at home
    }
    // Set profile image if available
    if (user.profile_image) {
      const { getProfileImageUrl } = await import('./services/apiService');
      setUserProfileImage(getProfileImageUrl(user.profile_image));
    }
    // Load saved image IDs
    loadSavedImageIds();
    
    // Show welcome toast with gradient username
    const userName = user.name || 'User';
    showToast(
      <>
        Welcome <span className={APP_TEXT_GRADIENT}>{userName}</span>
      </>,
      'success'
    );
    setHasShownWelcomeToast(true);
  };

  const handleSignUpSuccess = async (token: string, user: any) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setUserIsAdmin(user.is_admin || false);
    setIsAuthenticated(true);
    setShowSignUp(false);
    // Set role and default tab based on admin status
    if (user.is_admin) {
      setUserRole('admin');
      setActiveTab('dashboard'); // Admin starts at dashboard
    } else {
      setUserRole('user');
      setActiveTab('home'); // User starts at home
    }
    // Set profile image if available
    if (user.profile_image) {
      const { getProfileImageUrl } = await import('./services/apiService');
      setUserProfileImage(getProfileImageUrl(user.profile_image));
    }
    // Load saved image IDs
    loadSavedImageIds();
    
    // Show welcome toast with gradient username
    const userName = user.name || 'User';
    showToast(
      <>
        Welcome <span className={APP_TEXT_GRADIENT}>{userName}</span>
      </>,
      'success'
    );
    setHasShownWelcomeToast(true);
  };

  const handleSignOut = () => {
    // Show logout toast before clearing auth state
    showToast('Logged out successfully', 'success');
    // Reset welcome toast flag so it shows again on next login
    setHasShownWelcomeToast(false);
    // Clear auth state after a small delay to ensure toast is shown
    setTimeout(() => {
      localStorage.removeItem('authToken');
      setAuthToken(null);
      setIsAuthenticated(false);
      setActiveTab('home');
    }, 100);
  };

  // Switch Tab logic with role safety
  const handleTabChange = (newTab: Tab) => {
      setActiveTab(newTab);
  };

  // Toggle Admin Role (Prototype Feature)
  const toggleRole = () => {
    const newRole = userRole === 'user' ? 'admin' : 'user';
    setUserRole(newRole);
    // Reset to default tab for that role
    setActiveTab(newRole === 'admin' ? 'dashboard' : 'home');
  };

  // Splash Screen Logic - Show every time
  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => {
        // Check if walkthrough has been shown before
        const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough') === 'true';
        if (hasSeenWalkthrough) {
          setAppState('app');
        } else {
          setAppState('walkthrough');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Walkthrough Slides
  const walkthroughSlides = [
    {
      id: 1,
      title: "Upload or Capture",
      subtitle: "Use your camera to scan any face in seconds.",
      icon: <Scan size={64} className="text-brand-secondary" />
    },
    {
      id: 2,
      title: "AI Neural Search",
      subtitle: "Our engine finds matches across millions of data points.",
      icon: <Globe size={64} className="text-brand-primary" />
    },
    {
      id: 3,
      title: "Curate Moments",
      subtitle: "Save the best matches directly to your private gallery.",
      icon: <ImageIcon size={64} className="text-purple-400" />
    }
  ];
  const [slideIndex, setSlideIndex] = useState(0);

  const handleNextSlide = () => {
    if (slideIndex < walkthroughSlides.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      // Mark walkthrough as seen
      localStorage.setItem('hasSeenWalkthrough', 'true');
      setAppState('app');
    }
  };

  // App Action Handlers
  const handleStartProcess = (imageSource: string, file: File | null = null) => {
    setSourceImage(imageSource);
    setSourceFile(file);
    setIsProcessing(true);
  };

  const handleProfileImageScan = async (imageUrl: string) => {
    try {
      // showToast('Loading profile image for scanning...', 'success');
      
      // Fetch the image with CORS support
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile image');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'profile-image.jpg', { type: blob.type || 'image/jpeg' });
      
      // Create object URL for display
      const objectUrl = URL.createObjectURL(blob);
      handleStartProcess(objectUrl, file);
      showToast('Profile image loaded successfully', 'success');
    } catch (error: any) {
      console.error('Error loading profile image for scanning:', error);
      showToast(error.message || 'Failed to load profile image. Please try uploading it manually.', 'error');
    }
  };

  const handleCameraOpen = () => {
    // Try to use device camera directly
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          // Create video element to capture frame
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Create canvas to capture image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Create capture button overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center;';
            
            const videoContainer = document.createElement('div');
            videoContainer.style.cssText = 'position: relative; max-width: 90vw; max-height: 80vh;';
            
            const displayVideo = document.createElement('video');
            displayVideo.srcObject = stream;
            displayVideo.autoplay = true;
            displayVideo.playsInline = true;
            displayVideo.style.cssText = 'width: 100%; height: auto; border-radius: 12px;';
            
            const captureBtn = document.createElement('button');
            captureBtn.textContent = 'Capture';
            captureBtn.style.cssText = 'margin-top: 20px; padding: 12px 32px; background: linear-gradient(to right, #7c5cff, #32d2f0); color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = 'margin-top: 10px; padding: 8px 24px; background: rgba(255,255,255,0.1); color: white; border: none; border-radius: 8px; cursor: pointer;';
            
            captureBtn.onclick = () => {
              ctx?.drawImage(displayVideo, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) {
                  const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                  const url = URL.createObjectURL(blob);
                  handleStartProcess(url, file);
                }
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(overlay);
              }, 'image/jpeg', 0.9);
            };
            
            cancelBtn.onclick = () => {
              stream.getTracks().forEach(track => track.stop());
              document.body.removeChild(overlay);
            };
            
            videoContainer.appendChild(displayVideo);
            overlay.appendChild(videoContainer);
            overlay.appendChild(captureBtn);
            overlay.appendChild(cancelBtn);
            document.body.appendChild(overlay);
          });
        })
        .catch((error) => {
          console.error('Camera access denied or not available:', error);
          // Fallback to file input with capture
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              handleStartProcess(url, file);
            }
          };
          input.click();
        });
    } else {
      // Fallback for browsers without camera API
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          handleStartProcess(url, file);
        }
      };
      input.click();
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
         const url = URL.createObjectURL(file);
         handleStartProcess(url, file);
      }
    };
    input.click();
  };

  const handleSavePhoto = async (photo: PhotoResult) => {
    if (authToken) {
      try {
        const { saveToGallery } = await import('./services/apiService');
        await saveToGallery(authToken, photo);
        setSavedImageIds(prev => [...prev, photo.id]);
      } catch (error) {
        console.error('Failed to save photo:', error);
      }
    }
  };

  const handleDeletePhoto = (id: string) => {
    setSavedImageIds(prev => prev.filter(savedId => savedId !== id));
  };

  // Admin specific handlers
  const handleAdminUpdate = (id: string, updates: Partial<PhotoResult>) => {
    setAllImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const handleAdminDelete = (id: string) => {
    setAllImages(prev => prev.filter(img => img.id !== id));
  };

  /* --- RENDER SPLASH --- */
  if (appState === 'splash') {
    return (
      <div className={`fixed inset-0 z-50 bg-brand-dark dark:bg-brand-dark light:bg-white flex flex-col items-center justify-center overflow-hidden transition-colors duration-300`}>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-20 light:opacity-5 mix-blend-overlay transition-opacity duration-300" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Logo size="lg" animated={true} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-3xl font-display font-bold text-white dark:text-white light:text-gray-900 tracking-wider transition-colors duration-300"
        >
          FaceFinder
        </motion.h1>
        <div className="absolute bottom-10 w-full flex justify-center">
           <div className="w-12 h-1 bg-brand-dark dark:bg-brand-dark light:bg-gray-200 rounded-full overflow-hidden transition-colors duration-300">
              <motion.div 
                className="h-full bg-brand-secondary dark:bg-brand-secondary light:bg-brand-secondary/80 transition-colors duration-300"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.8 }}
              />
           </div>
        </div>
      </div>
    );
  }

  /* --- RENDER WALKTHROUGH --- */
  if (appState === 'walkthrough') {
    const currentSlide = walkthroughSlides[slideIndex];
    return (
      <div className={`fixed inset-0 z-50 bg-brand-dark dark:bg-brand-dark light:bg-white flex flex-col overflow-hidden transition-colors duration-300`}>
        <div className="flex-1 relative">
           {/* Background Blobs */}
           <motion.div 
             animate={{ 
               scale: [1, 1.2, 1],
               x: [0, 50, 0],
               y: [0, -50, 0]
             }}
             transition={{ duration: 10, repeat: Infinity }}
             className="absolute top-20 left-0 w-96 h-96 bg-brand-primary/20 dark:bg-brand-primary/20 light:bg-brand-primary/10 rounded-full blur-3xl transition-all duration-300" 
           />
           <motion.div 
             animate={{ 
               scale: [1.2, 1, 1.2],
               x: [0, -50, 0],
               y: [0, 50, 0]
             }}
             transition={{ duration: 10, repeat: Infinity }}
             className="absolute bottom-20 right-0 w-96 h-96 bg-brand-secondary/20 dark:bg-brand-secondary/20 light:bg-brand-secondary/10 rounded-full blur-3xl transition-all duration-300" 
           />

           <AnimatePresence mode='wait'>
             <motion.div 
               key={currentSlide.id}
               initial={{ opacity: 0, x: 100 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -100 }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
             >
               <div className="mb-12 relative">
                 <div className="absolute inset-0 bg-white/5 dark:bg-white/5 light:bg-gray-900/5 blur-xl rounded-full transition-all duration-300" />
                 <div className="relative glass-panel rounded-full p-8 border border-white/10 dark:border-white/10 light:border-gray-200/20 shadow-[0_0_40px_rgba(124,92,255,0.3)] dark:shadow-[0_0_40px_rgba(124,92,255,0.3)] light:shadow-[0_0_40px_rgba(124,92,255,0.2)] transition-all duration-300">
                    {currentSlide.icon}
                 </div>
               </div>
               <h2 className="text-3xl font-display font-bold mb-4 text-white dark:text-white light:text-gray-900 transition-colors duration-300">{currentSlide.title}</h2>
               <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-lg transition-colors duration-300">{currentSlide.subtitle}</p>
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Walkthrough Footer */}
        <div className="p-8 flex flex-col items-center">
          <div className="flex gap-2 mb-8">
            {walkthroughSlides.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === slideIndex ? 'w-8 bg-brand-secondary dark:bg-brand-secondary light:bg-brand-secondary/80' : 'w-2 bg-gray-700 dark:bg-gray-700 light:bg-gray-300'}`}
              />
            ))}
          </div>
          <GradientButton fullWidth onClick={handleNextSlide}>
            {slideIndex === walkthroughSlides.length - 1 ? "Get Started" : "Next"}
          </GradientButton>
        </div>
      </div>
    );
  }

  /* --- RENDER AUTHENTICATION --- */
  if (!isAuthenticated) {
    if (showSignUp) {
      return (
        <SignUp
          onSignUpSuccess={handleSignUpSuccess}
          onSwitchToSignIn={() => setShowSignUp(false)}
        />
      );
    }
    return (
      <SignIn
        onSignInSuccess={handleSignInSuccess}
        onSwitchToSignUp={() => setShowSignUp(true)}
      />
    );
  }

  /* --- RENDER MAIN APP --- */
  // Processing "sub-flow"
  if (isProcessing) {
    return (
      <>
        <Results 
          sourceImage={sourceImage}
          sourceFile={sourceFile}
          onBack={() => {
            setIsProcessing(false);
            setSourceFile(null);
            if (sourceImage && sourceImage.startsWith('blob:')) {
              URL.revokeObjectURL(sourceImage);
            }
            setSourceImage(null);
          }}
          onSave={handleSavePhoto}
          token={authToken}
          savedImageIds={savedImageIds}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-brand-dark dark:bg-brand-dark light:bg-white text-white dark:text-white light:text-gray-900 pb-20 transition-colors duration-500`}>
      <ServerStatus />
      
      <AnimatePresence mode='wait'>
        
        {/* USER ROUTES */}
        {userRole === 'user' && activeTab === 'home' && (
          <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Home 
              onCameraOpen={handleCameraOpen} 
              onUpload={handleUpload} 
              onProfile={() => setActiveTab('profile')}
              onUseProfileImage={handleProfileImageScan}
              hasProfileImage={!!userProfileImage}
              profileImageUrl={userProfileImage}
              isAdmin={userIsAdmin}
              userName={userData?.name}
              onThemeToggle={handleThemeToggle}
              onLogout={handleSignOut}
              isDarkTheme={isDarkTheme}
            />
          </motion.div>
        )}

        {/* ADMIN ROUTES */}
        {userRole === 'admin' && activeTab === 'dashboard' && (
            <motion.div key="admin-dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <AdminDashboard 
                  onUpload={handleUpload} 
                  onUploadComplete={() => {
                    // Refresh all images when upload completes
                    setActiveTab('all-images');
                  }}
                />
            </motion.div>
        )}
        {userRole === 'admin' && activeTab === 'all-images' && (
            <motion.div key="admin-all" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <AllImages images={allImages} onUpdate={handleAdminUpdate} onDelete={handleAdminDelete} />
            </motion.div>
        )}

        {/* SHARED ROUTES */}
        {activeTab === 'gallery' && (
          <motion.div key="gallery" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Gallery token={authToken} onDelete={handleDeletePhoto} />
          </motion.div>
        )}
        {activeTab === 'profile' && (
          <motion.div key="profile" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <Profile 
              role={userRole} 
              onToggleRole={toggleRole} 
              token={authToken} 
              onSignOut={handleSignOut}
              onUseProfileImageForScan={handleProfileImageScan}
              onThemeToggle={handleThemeToggle}
              isDarkTheme={isDarkTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} role={userRole} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;

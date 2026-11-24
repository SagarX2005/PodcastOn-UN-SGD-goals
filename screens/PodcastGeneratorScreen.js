import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  ImageBackground,
  Animated,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { spacing } from '../styles/globalStyles';
import {
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import OpenAI from 'openai';
import { supabase } from '../supabase';
import { useFocusEffect } from '@react-navigation/native';
import { getApiKey } from '../utils/apiKeyStore';

const { width, height } = Dimensions.get('window');

// Custom Loading Modal Component
const LoadingModal = ({ visible, status, progress }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 15, 0.97)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <LinearGradient
          colors={['#1A1A20', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 30,
            padding: 40,
            alignItems: 'center',
            shadowColor: '#8A2BE2',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.6,
            shadowRadius: 30,
            elevation: 20,
            borderWidth: 2,
            borderColor: 'rgba(138,43,226,0.5)',
            width: width * 0.85,
          }}
        >
          <View style={{
            marginBottom: 24,
            position: 'relative',
          }}>
            <Animated.View style={{
              position: 'absolute',
              width: 90,
              height: 90,
              transform: [{ rotate: spin }],
            }}>
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4', '#8A2BE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  padding: 3,
                }}
              >
                <View style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 42,
                  backgroundColor: '#1A1A20',
                }} />
              </LinearGradient>
            </Animated.View>

            <View style={{
              width: 90,
              height: 90,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialCommunityIcons name="microphone" size={40} color="#FFF" />
              </LinearGradient>
            </View>
          </View>

          <Text style={{
            fontSize: 22,
            fontWeight: '700',
            color: '#F5F5F5',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            {status === 'script' ? 'Crafting Script...' : 
             status === 'audio' ? 'Generating Audio...' : 
             status === 'reviewing' ? 'Reviewing for Fairness...' :
             'Processing...'}
          </Text>

          <Text style={{
            fontSize: 14,
            color: 'rgba(245,245,245,0.7)',
            textAlign: 'center',
            marginBottom: 32,
          }}>
            {status === 'script' ? 'Creating your personalized podcast script' : 
             status === 'audio' ? 'Converting script to audio' : 
             status === 'reviewing' ? 'Checking the script for respectful, balanced representation' :
             'Please wait...'}
          </Text>

          <View style={{
            width: '100%',
            marginBottom: 20,
          }}>
            <View style={{
              width: '100%',
              height: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 6,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <Animated.View style={{
                height: '100%',
                width: progressWidth,
                borderRadius: 6,
              }}>
                <LinearGradient
                  colors={['#8A2BE2', '#FF69B4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              
              {progress > 0 && (
                <Animated.View style={{
                  position: 'absolute',
                  left: progressWidth,
                  top: -4,
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#FF69B4',
                  shadowColor: '#FF69B4',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.8,
                  shadowRadius: 4,
                  elevation: 5,
                  borderWidth: 2,
                  borderColor: '#FFF',
                  marginLeft: -10,
                }} />
              )}
            </View>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontSize: 32,
              fontWeight: '700',
              color: '#FF69B4',
            }}>
              {Math.round(progress)}
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: 'rgba(245,245,245,0.6)',
              marginLeft: 4,
            }}>
              %
            </Text>
          </View>

          <Text style={{
            fontSize: 12,
            color: 'rgba(245,245,245,0.5)',
            marginTop: 8,
          }}>
            Complete
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

// Custom Success Modal Component
const SuccessModal = ({ visible, onClose, podcastName }) => {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      fadeValue.setValue(0);
    }
  }, [visible]);

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="none"
      statusBarTranslucent={true}
    >
      <Animated.View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 15, 0.97)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeValue,
      }}>
        <Animated.View style={{
          transform: [{ scale: scaleValue }],
        }}>
          <LinearGradient
            colors={['#1A1A20', '#0A0A0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 30,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#8A2BE2',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.6,
              shadowRadius: 30,
              elevation: 20,
              borderWidth: 2,
              borderColor: 'rgba(138,43,226,0.5)',
              width: width * 0.85,
            }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(138,43,226,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Feather name="check" size={40} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={{
              fontSize: 24,
              fontWeight: '700',
              color: '#F5F5F5',
              marginBottom: 12,
              textAlign: 'center',
            }}>
              Success! 🎉
            </Text>

            <Text style={{
              fontSize: 16,
              color: 'rgba(245,245,245,0.8)',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              <Text style={{ fontWeight: '600', color: '#FF69B4' }}>
                {podcastName}
              </Text>
            </Text>

            <Text style={{
              fontSize: 14,
              color: 'rgba(245,245,245,0.7)',
              textAlign: 'center',
              marginBottom: 32,
            }}>
              Generated Successfully!
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#8A2BE2', '#FF69B4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: '#FFF',
                  fontWeight: '700',
                  fontSize: 16,
                }}>
                  Awesome!
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Custom Error Modal Component
const ErrorModal = ({ visible, onClose, errorMessage }) => {
  const shakeValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(shakeValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 10, 15, 0.97)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Animated.View style={{
          transform: [{ translateX: shakeValue }],
        }}>
          <LinearGradient
            colors={['#1A1A20', '#0A0A0F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 30,
              padding: 40,
              alignItems: 'center',
              shadowColor: '#FF4444',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.6,
              shadowRadius: 30,
              elevation: 20,
              borderWidth: 2,
              borderColor: 'rgba(255,68,68,0.5)',
              width: width * 0.85,
            }}
          >
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,68,68,0.2)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#FF4444',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Feather name="x" size={40} color="#FFF" />
              </View>
            </View>

            <Text style={{
              fontSize: 22,
              fontWeight: '700',
              color: '#F5F5F5',
              marginBottom: 12,
              textAlign: 'center',
            }}>
              Oops! Something went wrong
            </Text>

            <Text style={{
              fontSize: 14,
              color: 'rgba(245,245,245,0.7)',
              textAlign: 'center',
              marginBottom: 32,
            }}>
              {errorMessage || 'Failed to generate podcast. Please try again.'}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#FF4444', '#CC0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: '#FFF',
                  fontWeight: '700',
                  fontSize: 16,
                }}>
                  Try Again
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Memoize Card component to prevent unnecessary re-renders
const Card = React.memo(({ children }) => (
  <LinearGradient
    colors={['#1A1A20', '#0A0A0F']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: 22,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      shadowColor: '#8A2BE2',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 12,
      borderWidth: 1.5,
      borderColor: 'rgba(138,43,226,0.4)',
    }}
  >
    {children}
  </LinearGradient>
));

const PodcastGeneratorScreen = () => {
  const [selectedSDG, setSelectedSDG] = useState('No Poverty');
  const [language, setLanguage] = useState('en'); // 'en' = English
  const [style, setStyle] = useState('Storytelling');
  const [religion, setReligion] = useState(null);
  const [customReligion, setCustomReligion] = useState('');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedPodcastName, setGeneratedPodcastName] = useState('');
  const [userApiKey, setUserApiKey] = useState(null);
  const [loadingApiKey, setLoadingApiKey] = useState(true);

  const scrollY = new Animated.Value(0);
  const confettiRef = useRef(null);
  const notesInputRef = useRef(null);
  const customReligionInputRef = useRef(null);

  const loadUserApiKey = useCallback(async () => {
    setLoadingApiKey(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const key = await getApiKey(user.id);
        setUserApiKey(key || null);
      }
    } catch (error) {
      console.error('Error loading API key:', error?.message);
    } finally {
      setLoadingApiKey(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserApiKey();
    }, [loadUserApiKey])
  );

  const SDGOptions = [
    'No Poverty', 'Zero Hunger', 'Good Health and Well-being',
    'Quality Education', 'Gender Equality', 'Clean Water and Sanitation',
    'Affordable and Clean Energy', 'Decent Work and Economic Growth',
    'Industry, Innovation and Infrastructure', 'Reduced Inequalities',
    'Sustainable Cities and Communities', 'Responsible Consumption and Production',
    'Climate Action', 'Life Below Water', 'Life on Land',
    'Peace, Justice and Strong Institutions', 'Partnerships for the Goals',
  ];

  const languageOptions = [
    { id: 'en', label: 'English 🇺🇸' },
    { id: 'es', label: 'Spanish 🇪🇸' },
    { id: 'ar', label: 'Arabic 🇸🇦' },
    { id: 'fr', label: 'French 🇫🇷' },
    { id: 'hi', label: 'Hindi 🇮🇳' },
    { id: 'ja', label: 'Japanese 🇯🇵' },
    { id: 'zh', label: 'Chinese 🇨🇳' },
    { id: 'de', label: 'German 🇩🇪' },
  ];

  const stylesOptions = [
    { id: 'Conversational', label: 'Conversational', icon: <Feather name="message-circle" size={18} color="#F5F5F5" /> },
    { id: 'Educational', label: 'Educational', icon: <Feather name="book-open" size={18} color="#F5F5F5" /> },
    { id: 'Storytelling', label: 'Storytelling', icon: <MaterialCommunityIcons name="drama-masks" size={18} color="#F5F5F5" /> },
    { id: 'Motivational', label: 'Motivational', icon: <FontAwesome5 name="bullhorn" size={16} color="#F5F5F5" /> },
    { id: 'Spiritual', label: 'Spiritual', icon: <MaterialCommunityIcons name="meditation" size={20} color="#F5F5F5" /> },
    { id: 'Humorous', label: 'Humorous', icon: <Feather name="smile" size={20} color="#F5F5F5" /> },
  ];

  const religionOptions = [
    { id: 'Christianity', label: 'Christianity', icon: <FontAwesome5 name="cross" size={18} color="#F5F5F5" /> },
    { id: 'Islam', label: 'Islam', icon: <FontAwesome5 name="mosque" size={18} color="#F5F5F5" /> },
    { id: 'Hinduism', label: 'Hinduism', icon: <FontAwesome5 name="om" size={20} color="#F5F5F5" /> },
    { id: 'Buddhism', label: 'Buddhism', icon: <FontAwesome5 name="yin-yang" size={20} color="#F5F5F5" /> },
    { id: 'Sikhism', label: 'Sikhism', icon: <FontAwesome5 name="dharmachakra" size={20} color="#F5F5F5" /> },
    { id: 'Judaism', label: 'Judaism', icon: <FontAwesome5 name="star-of-david" size={20} color="#F5F5F5" /> },
    { id: 'Other', label: 'Other', icon: <FontAwesome5 name="star" size={18} color="#F5F5F5" /> },
  ];

  const handleNotesChange = useCallback((text) => {
    setNotes(text);
  }, []);

  const handleCustomReligionChange = useCallback((text) => {
    setCustomReligion(text);
  }, []);

  const handleReligionSelect = useCallback((id) => {
    if (religion === id) {
      setReligion(null);
      setCustomReligion('');
    } else {
      setReligion(id);
      if (id !== 'Other') setCustomReligion('');
    }
  }, [religion]);

  async function generateScriptFromOpenRouter(prompt) {
    if (!userApiKey) {
      throw new Error("Please set your OpenRouter API key in the API Key Management screen.");
    }

    const userClient = new OpenAI({
      apiKey: userApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });

    try {
      const completion = await userClient.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
      });
      return completion.choices[0].message.content;
    } catch (apiError) {
      console.error("OpenRouter API error:", apiError?.status, apiError?.message);
      if (apiError.status === 401 || apiError.message?.includes("401") || apiError.message?.includes("User not found")) {
        throw new Error("Invalid or incomplete OpenRouter API key. Please re-enter your key in Settings -> API Key Management.");
      }
      if (apiError.status === 402 || apiError.message?.includes("402")) {
        throw new Error("Insufficient OpenRouter credits. Please add credits at openrouter.ai/settings/credits.");
      }
      throw new Error(apiError.message || "Failed to generate script from AI.");
    }
  }

  const BIAS_RUBRIC = `You review interfaith educational podcast scripts. Check the script for:
1. Stereotypes or reductive portrayals of the named tradition.
2. Inflammatory, negative or disrespectful tone toward any faith.
3. A tradition presented as superior or as the only correct view.
4. Religious doctrine stated as fact without attribution.
Flag only clear problems. A neutral, respectful description of what a tradition believes is NOT a problem.
Return ONLY JSON, no markdown: {"flagged": true|false, "issues": ["short issue", ...]}`;

  async function reviewScript(script, religionLabel) {
    const client = new OpenAI({
      apiKey: userApiKey,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
    });
    try {
      const r = await client.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{
          role: "user",
          content: `${BIAS_RUBRIC}\n\nTradition: ${religionLabel}\n\nScript:\n${script}`,
        }],
        max_tokens: 400,
        temperature: 0,
      });
      const raw = (r.choices[0].message.content || "").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(raw);
      return { flagged: !!parsed.flagged, issues: Array.isArray(parsed.issues) ? parsed.issues : [] };
    } catch (e) {
      console.warn("Bias review failed:", e?.message);
      return { flagged: false, issues: [], error: e?.message || "review_failed" }; // fail-open by design
    }
  }

  async function generateReviewedScript(prompt, religionLabel) {
    let script = await generateScriptFromOpenRouter(prompt);
    setGenerationStatus('reviewing');
    let check = await reviewScript(script, religionLabel);
    let retries = 0;
    if (check.flagged) {
      retries = 1;
      const firstPassIssues = check.issues;
      setGenerationStatus('script');
      const fixPrompt = `${prompt}\n\nRevision required. A reviewer flagged these problems in an earlier draft:\n- ${firstPassIssues.join("\n- ")}\nRewrite the script and fix every one of them. Keep all original structure and length requirements.`;
      script = await generateScriptFromOpenRouter(fixPrompt);
      setGenerationStatus('reviewing');
      check = { ...(await reviewScript(script, religionLabel)), firstPassIssues };
    }
    return { script, check, retries };
  }

  const savePodcastToSupabase = async (title, script, check, retries) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to save a podcast.");
    }

    // FIXED: Save 'none' explicitly when no religion is selected
    let religionToSave;
    if (religion === 'Other' && customReligion) {
      religionToSave = customReligion.toLowerCase();
    } else if (religion) {
      religionToSave = religion.toLowerCase();
    } else {
      religionToSave = 'none';
    }

    console.log('Saving to Supabase:', {
      title,
      style,
      religion: religionToSave,
      language: language,
    });

    const { data, error } = await supabase
      .from('podcasts')
      .insert([{
        user_id: user.id,
        title,
        script,
        style,
        religion: religionToSave,
        language: language,
        bias_check: check || null,
        bias_retries: retries || 0,
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return data.id;
  };

  const getSpeakerName = (lang) => {
    switch (lang) {
      case "en": return "Matthew";
      case "es": return "Enrique";
      case "fr": return "Mathieu";
      case "de": return "Daniel";
      case "hi": return "Aditi";
      case "ar": return "Zeina";
      case "zh": return "Zhiyu";
      case "ja": return "Takumi";
      default: return "Matthew";
    }
  };

  const handleGenerate = async () => {
    Keyboard.dismiss();

    // Step 0: Check and fetch API key from database
    setProgress(5);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage('You must be logged in to generate a podcast.');
        setShowErrorModal(true);
        return;
      }

      const key = await getApiKey(user.id);
      if (!key) {
        setErrorMessage('Please set your OpenRouter API key in the API Key Management screen.');
        setShowErrorModal(true);
        return;
      }

      // Update state with latest API key
      setUserApiKey(key);
    } catch (error) {
      console.error('Error checking API key:', error?.message);
      setErrorMessage('Error checking API key. Please try again.');
      setShowErrorModal(true);
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('script');
    setProgress(10);
    setErrorMessage('');

    const podcastTitle = `${selectedSDG} Podcast`;
    setGeneratedPodcastName(podcastTitle);

    const speakerName = getSpeakerName(language);

    const prompt = `Write a professional, emotionally engaging, and human-like podcast script of approximately 1200–1500 words (7–9 minutes when spoken aloud).

Topic: ${selectedSDG} (United Nations Sustainable Development Goals).
Podcast style: ${style}.
Language: ${languageOptions.find(opt => opt.id === language)?.label || 'English'}.
Religious or ethical perspective: ${
  religion === 'Other' && customReligion
    ? customReligion
    : religion || 'None (secular or interfaith)'
}.
Additional user notes: ${notes || 'None'}.
Target audience: General public with no assumed technical or theological background.

Narrative and tone guidelines:
- Maintain a respectful, inclusive, and non-authoritative tone.
- Avoid presenting any religious or ethical viewpoint as absolute or superior.
- Frame religious perspectives as sources of values, reflection, and moral insight rather than doctrine.
- Avoid controversial, political, or divisive interpretations.
- Ensure the content is suitable for interfaith and multicultural audiences.

Structural requirements:
- Present the script as one continuous narration spoken by a single host.
- Do NOT include headings, section titles, labels, stage directions, or metadata.
- Begin with a warm, inviting introduction that connects everyday human experience to the SDG topic.
- Develop three well-balanced narrative segments:
  1. Introduce the global challenge related to the SDG in simple, relatable terms.
  2. Explore how the chosen religious or ethical perspective offers values, stories, or principles relevant to this challenge.
  3. Connect these values to practical, real-world actions individuals and communities can take.
- Use smooth transitions between segments so the narration flows naturally.

Language and delivery constraints:
- Use clear, conversational language that sounds natural when spoken aloud.
- Avoid jargon, bullet points, or list-like phrasing.
- Vary sentence length to maintain listener engagement.
- Use gentle storytelling and examples rather than formal explanations.

Closing requirement:
- End with a calm, inspiring call-to-action focused on empathy, responsibility, or collective well-being.
- Conclude with a unique, personalized sign-off thanking listeners for tuning in and signing off with the speaker name "${speakerName}".
  Example: "Thank you for listening—this is ${speakerName}, signing off."`;


    try {
      // Step 1: Generate Script
      setProgress(20);
      const religionLabel = religion === 'Other' && customReligion ? customReligion : religion || 'None';
      const { script, check, retries } = await generateReviewedScript(prompt, religionLabel);

      setProgress(40);
      const podcastId = await savePodcastToSupabase(podcastTitle, script, check, retries);

      // Step 2: Generate Audio
      setGenerationStatus('audio');
      setProgress(60);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsGenerating(false);
        setGenerationStatus('idle');
        Alert.alert('Session Expired', 'Please log in again.');
        return;
      }

      const metroHost = NativeModules?.SourceCode?.scriptURL
        ? NativeModules.SourceCode.scriptURL.split('://')[1]?.split(':')[0]
        : null;

      const endpoints = [
        process.env.EXPO_PUBLIC_BACKEND_URL || null,
        metroHost ? `http://${metroHost}:3001` : null,
        Platform.OS === 'android' ? 'http://10.0.2.2:3001' : null,
        'http://localhost:3001',
        'http://172.20.10.2:3001',
        'http://172.20.10.13:3001',
      ].filter(Boolean);

      let res;
      let lastErr;
      for (const endpoint of endpoints) {
        try {
          res = await fetch(`${endpoint}/api/generatePodcast`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ podcastId }),
          });
          if (res) {
            if (res.status === 401) {
              setIsGenerating(false);
              setGenerationStatus('idle');
              Alert.alert('Unauthorized', 'Please log in again');
              return;
            }
            if (res.status === 403) {
              setIsGenerating(false);
              setGenerationStatus('idle');
              Alert.alert('Forbidden', 'You can only create audio for your own podcasts');
              return;
            }
            break;
          }
        } catch (networkErr) {
          lastErr = networkErr;
        }
      }
      if (!res) throw lastErr || new Error('Could not connect to audio backend server.');

      const result = await res.json();

      setProgress(90);

      if (result.success) {
        setProgress(100);

        setTimeout(() => {
          setIsGenerating(false);
          setGenerationStatus('idle');
          setShowSuccessModal(true);

          if (confettiRef.current) {
            confettiRef.current.start();
          }
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to generate podcast audio');
      }

    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
      setIsGenerating(false);
      setGenerationStatus('idle');
      setProgress(0);
      setShowErrorModal(true);
    }
  };

  const resetForm = () => {
    setSelectedSDG('No Poverty');
    setLanguage('en');
    setStyle('Storytelling');
    setReligion(null);
    setCustomReligion('');
    setNotes('');
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setProgress(0);
    resetForm();
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    setProgress(0);
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp',
  });

  const headerFontSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [28, 20],
    extrapolate: 'clamp',
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require('../assets/background-pattern.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
          <Animated.View style={{ height: headerHeight }}>
            <LinearGradient
              colors={['#8A2BE2', '#FF69B4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 30,
                borderBottomLeftRadius: 40,
                borderBottomRightRadius: 40,
              }}
            >
              <Animated.Text
                style={{
                  fontSize: headerFontSize,
                  color: '#F5F5F5',
                  fontWeight: '700',
                }}
              >
                Generate Podcast
              </Animated.Text>
            </LinearGradient>
          </Animated.View>

          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <Animated.ScrollView
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 280 }}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {/* SDG Picker */}
              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: '#F5F5F5' }}>
                  Select SDG Topic
                </Text>
                <View style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}>
                  <Picker
                    selectedValue={selectedSDG}
                    onValueChange={(itemValue) => setSelectedSDG(itemValue)}
                    dropdownIconColor="#F5F5F5"
                    style={{ color: '#F5F5F5' }}
                  >
                    {SDGOptions.map((sdg) => (
                      <Picker.Item key={sdg} label={sdg} value={sdg} />
                    ))}
                  </Picker>
                </View>
              </Card>

              {/* Language Picker */}
              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: '#F5F5F5' }}>
                  Select Language
                </Text>
                {languageOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setLanguage(option.id)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: spacing.sm,
                      paddingVertical: spacing.md,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: language === option.id ? '#FF69B4' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <Text style={{ color: '#F5F5F5', fontWeight: '600', fontSize: 16 }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Card>

              {/* Style Picker */}
              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: '#F5F5F5' }}>
                  Select Podcast Style
                </Text>
                {stylesOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setStyle(option.id)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: spacing.sm,
                      paddingVertical: spacing.md,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: style === option.id ? '#FF69B4' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {option.icon}
                    <Text style={{ marginLeft: 8, color: '#F5F5F5', fontWeight: '600', fontSize: 16 }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Card>

              {/* Religion Picker */}
              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: '#F5F5F5' }}>
                  Religious Preference (Optional)
                </Text>
                {religionOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleReligionSelect(option.id)}
                    activeOpacity={0.8}
                    style={{
                      marginTop: spacing.sm,
                      paddingVertical: spacing.md,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: religion === option.id ? '#FF69B4' : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {option.icon}
                    <Text style={{ marginLeft: 8, color: '#F5F5F5', fontWeight: '600', fontSize: 16 }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                {religion === 'Other' && (
                  <TextInput
                    ref={customReligionInputRef}
                    placeholder="Enter your religion..."
                    placeholderTextColor="rgba(245,245,245,0.5)"
                    value={customReligion}
                    onChangeText={handleCustomReligionChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    blurOnSubmit={true}
                    enablesReturnKeyAutomatically={true}
                    keyboardType="default"
                    style={{
                      marginTop: spacing.md,
                      borderRadius: 12,
                      padding: spacing.md,
                      fontSize: 16,
                      color: '#F5F5F5',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  />
                )}
              </Card>

              {/* Notes */}
              <Card>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: '#F5F5F5' }}>
                  Additional Requirements / Notes
                </Text>
                <TextInput
                  ref={notesInputRef}
                  placeholder="E.g., Include a family with two children..."
                  placeholderTextColor="rgba(245,245,245,0.5)"
                  value={notes}
                  onChangeText={handleNotesChange}
                  multiline={true}
                  numberOfLines={4}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  textAlignVertical="top"
                  blurOnSubmit={false}
                  keyboardType="default"
                  style={{
                    minHeight: 120,
                    maxHeight: 200,
                    borderRadius: 12,
                    padding: spacing.md,
                    fontSize: 16,
                    color: '#F5F5F5',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                />
              </Card>

              {/* Generate Button */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleGenerate}
                disabled={isGenerating || loadingApiKey || !userApiKey}
                style={{
                  marginTop: spacing.xl,
                  borderRadius: 30,
                  overflow: 'hidden',
                  width: 220,
                  alignSelf: 'center',
                  opacity: (isGenerating || loadingApiKey || !userApiKey) ? 0.6 : 1,
                }}
              >
                <LinearGradient
                  colors={['#8A2BE2', '#FF69B4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: spacing.md + 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 30,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons
                      name="microphone"
                      size={20}
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                      {isGenerating ? 'Generating...' : 'Generate Podcast'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {!loadingApiKey && !userApiKey && (
                <Text style={{
                  color: '#FF4444',
                  fontSize: 14,
                  fontWeight: '600',
                  textAlign: 'center',
                  marginTop: spacing.md,
                  marginHorizontal: spacing.lg,
                }}>
                  Please set your OpenRouter API key in the API Key Management screen.
                </Text>
              )}
            </Animated.ScrollView>
          </KeyboardAvoidingView>

          {/* Loading Modal */}
          <LoadingModal 
            visible={isGenerating} 
            status={generationStatus}
            progress={progress}
          />

          {/* Success Modal */}
          <SuccessModal 
            visible={showSuccessModal}
            onClose={handleSuccessClose}
            podcastName={generatedPodcastName}
          />

          {/* Error Modal */}
          <ErrorModal 
            visible={showErrorModal}
            onClose={handleErrorClose}
            errorMessage={errorMessage}
          />

          {/* Confetti 🎉 */}
          <ConfettiCannon
            ref={confettiRef}
            count={100}
            origin={{ x: width / 2, y: -10 }}
            autoStart={false}
            fadeOut
            fallSpeed={2500}
          />
        </View>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

export default PodcastGeneratorScreen;
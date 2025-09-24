import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Camera, Save, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../services/api';
import { API_CONFIG } from '../../config/api.config';
import LoadingSpinner from '../common/LoadingSpinner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: {
    displayName: string;
    bio: string;
    avatar: string;
    preferences?: {
      notifications?: {
        gameResults?: boolean;
        newPlayerPacks?: boolean;
        tournamentInvitations?: boolean;
      };
      language?: string;
    };
  };
  onProfileUpdate?: (updatedData: any) => void;
}

const EditProfileModal = ({ isOpen, onClose, currentProfile, onProfileUpdate }: EditProfileModalProps) => {
  const [formData, setFormData] = useState({
    displayName: currentProfile.displayName || '',
    bio: currentProfile.bio || '',
    avatar: currentProfile.avatar || '',
    preferences: {
      notifications: {
        gameResults: currentProfile.preferences?.notifications?.gameResults ?? true,
        newPlayerPacks: currentProfile.preferences?.notifications?.newPlayerPacks ?? true,
        tournamentInvitations: currentProfile.preferences?.notifications?.tournamentInvitations ?? false,
      },
      language: currentProfile.preferences?.language || 'en',
    },
  });

  const [previewAvatar, setPreviewAvatar] = useState<string>(currentProfile.avatar || '');
  const queryClient = useQueryClient();

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      console.log('💾 Saving profile changes to production API:', profileData);
      console.log('🔗 Using endpoint:', '/auth/profile');
      console.log('🌐 API Base URL:', API_CONFIG.BASE_URL);
      try {
        const result = await ApiService.updateUserProfile(profileData);
        console.log('✅ Profile saved successfully to production API:', result);
        return result;
      } catch (error) {
        console.error('❌ Profile save failed to production API:', error);
        throw new Error(`Failed to save profile: ${error.message || 'Unknown error'}`);
      }
    },
    onSuccess: (data) => {
      console.log('✅ Profile updated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['complete-user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      
      // Update parent component state if callback provided
      onProfileUpdate?.(formData);
      
      onClose();
      
      // Show success message
      const successMessage = data?.success ? 
        '✅ ¡Perfil actualizado exitosamente en la API de producción!' :
        '✅ ¡Perfil actualizado localmente (se sincronizará cuando la API esté disponible)!';
      alert(successMessage);
    },
    onError: (error: any) => {
      console.error('❌ Error updating profile:', error);
      alert(`❌ Error actualizando perfil en API de producción: ${error.message || 'Error de conexión. Inténtalo de nuevo.'}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.displayName.trim()) {
      alert('❌ El nombre de usuario es requerido');
      return;
    }

    console.log('🚀 Updating profile with data:', formData);
    updateProfileMutation.mutate(formData);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('❌ La imagen debe ser menor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreviewAvatar(result);
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (notificationType: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [notificationType]: value,
        },
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-dark-400 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Avatar Section */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 mx-auto mb-4">
                  <img
                    src={previewAvatar || formData.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300'}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300';
                    }}
                  />
                </div>
                
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-football-green rounded-full flex items-center justify-center cursor-pointer hover:bg-football-blue transition-colors shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-gray-400 text-sm">
                Click the camera icon to change your avatar
                {previewAvatar && previewAvatar !== currentProfile.avatar && (
                  <span className="block text-football-green text-xs mt-1">✓ New image selected</span>
                )}
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  className="w-full input-field"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full input-field resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Language
                </label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, language: e.target.value }
                  }))}
                  className="w-full input-field"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </div>

            {/* Notification Preferences */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 glass rounded-lg">
                  <div>
                    <span className="text-white font-medium">Game Results</span>
                    <p className="text-gray-400 text-sm">Get notified when your games finish</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications.gameResults}
                    onChange={(e) => handleNotificationChange('gameResults', e.target.checked)}
                    className="w-5 h-5 text-football-green bg-gray-700 border-gray-600 rounded focus:ring-football-green focus:ring-2"
                  />
                </label>

                <label className="flex items-center justify-between p-3 glass rounded-lg">
                  <div>
                    <span className="text-white font-medium">New Player Packs</span>
                    <p className="text-gray-400 text-sm">Be the first to know about new releases</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications.newPlayerPacks}
                    onChange={(e) => handleNotificationChange('newPlayerPacks', e.target.checked)}
                    className="w-5 h-5 text-football-green bg-gray-700 border-gray-600 rounded focus:ring-football-green focus:ring-2"
                  />
                </label>

                <label className="flex items-center justify-between p-3 glass rounded-lg">
                  <div>
                    <span className="text-white font-medium">Tournament Invitations</span>
                    <p className="text-gray-400 text-sm">Receive invites to special tournaments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.preferences.notifications.tournamentInvitations}
                    onChange={(e) => handleNotificationChange('tournamentInvitations', e.target.checked)}
                    className="w-5 h-5 text-football-green bg-gray-700 border-gray-600 rounded focus:ring-football-green focus:ring-2"
                  />
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
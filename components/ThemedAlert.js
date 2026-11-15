// components/ThemedAlert.js
import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../styles/globalStyles';

export default function ThemedAlert({ visible, title, message, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <LinearGradient
          colors={['#1A1A20', '#0A0A0F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            maxWidth: 360,
            borderRadius: 20,
            padding: spacing.lg,
            borderWidth: 1.5,
            borderColor: 'rgba(138,43,226,0.4)',
          }}
        >
          <Text
            style={{
              color: '#F5F5F5',
              fontSize: 20,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: spacing.sm,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: 'rgba(245,245,245,0.7)',
              fontSize: 15,
              textAlign: 'center',
              marginBottom: spacing.lg,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={{ overflow: 'hidden', borderRadius: 12 }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8A2BE2', '#FF69B4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingVertical: 12, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>OK</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

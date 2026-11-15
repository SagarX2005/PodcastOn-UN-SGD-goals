// components/NetworkGuard.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export default function NetworkGuard({ children }) {
  const [isConnected, setIsConnected] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // treat null/undefined as offline
      const ok = !!state?.isConnected && (state.isInternetReachable !== false);
      setIsConnected(ok);
      setChecking(false);
    });

    // quick initial fetch
    NetInfo.fetch().then((state) => {
      const ok = !!state?.isConnected && (state.isInternetReachable !== false);
      setIsConnected(ok);
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  const retry = async () => {
    setChecking(true);
    const state = await NetInfo.fetch();
    const ok = !!state?.isConnected && (state.isInternetReachable !== false);
    setIsConnected(ok);
    setChecking(false);
  };

  if (!isConnected) {
    return (
      <View style={styles.offline}>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>Connect to Wi-Fi or mobile data to continue.</Text>
        <TouchableOpacity style={styles.btn} onPress={retry}>
          <Text style={styles.btnText}>{checking ? "Checking..." : "Retry"}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // connected -> render app
  return children;
}

const styles = StyleSheet.create({
  offline: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 20, color: "#fff", fontWeight: "700", marginBottom: 12 },
  message: { color: "#ddd", textAlign: "center", marginBottom: 20 },
  btn: {
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});

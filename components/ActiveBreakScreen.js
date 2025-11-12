import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ProgressBarAndroid } from 'react-native';
import Video from 'react-native-video';
import { useNavigation, useRoute } from '@react-navigation/native';

const ActiveBreakScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { exercise, duration = 60 } = route.params || {};

  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timer;
    if (!isPaused && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, timeLeft]);

  const handlePauseToggle = () => setIsPaused(prev => !prev);
  const handleFinish = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise?.name || 'Ejercicio guiado'}</Text>
      <Text style={styles.description}>{exercise?.description || 'Sigue las instrucciones para moverte.'}</Text>

      <Video
        source={{ uri: exercise?.videoUri || 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        style={styles.video}
        resizeMode="contain"
        paused={isPaused}
      />

      <Text style={styles.timer}>{timeLeft}s restantes</Text>
      <ProgressBarAndroid styleAttr="Horizontal" progress={(duration - timeLeft) / duration} indeterminate={false} />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={handlePauseToggle}>
          <Text>{isPaused ? 'Reanudar' : 'Pausar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          <Text>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ActiveBreakScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f0f4f7' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  description: { fontSize: 16, marginBottom: 20 },
  video: { width: '100%', height: 200, backgroundColor: '#000' },
  timer: { fontSize: 20, textAlign: 'center', marginVertical: 10 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  button: { padding: 10, backgroundColor: '#ddd', borderRadius: 5 },
});
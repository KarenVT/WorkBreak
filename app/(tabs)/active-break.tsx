import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Video } from 'expo-av';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';

export default function ActiveBreakScreen() {
    const router = useRouter();
    const { exercise, duration } = useLocalSearchParams();
    const parsedExercise = exercise ? JSON.parse(exercise as string) : null;
    const totalTime = Number(duration) || 60;

    const [timeLeft, setTimeLeft] = useState(totalTime);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!isPaused && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused, timeLeft]);

    const handleFinish = () => router.back();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{parsedExercise?.name || 'Ejercicio guiado'}</Text>
            <Text style={styles.description}>{parsedExercise?.description || 'Sigue las instrucciones durante la pausa activa.'}</Text>

            <Video
                source={require('../../assets/videos/Es_hora_de_la_pausa_activa.mp4')}
                style={styles.video}
                resizeMode="contain"
                shouldPlay={!isPaused}
                isLooping
            />

            <Text style={styles.timer}>{timeLeft}s restantes</Text>
            <ProgressBar progress={(totalTime - timeLeft) / totalTime} />

            <View style={styles.controls}>
                <Button onPress={() => setIsPaused(prev => !prev)}>{isPaused ? 'Reanudar' : 'Pausar'}</Button>
                <Button onPress={handleFinish}>Finalizar</Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    description: { fontSize: 16, marginBottom: 20 },
    video: { width: '100%', height: 200, backgroundColor: '#000' },
    timer: { fontSize: 20, textAlign: 'center', marginVertical: 10 },
    controls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});

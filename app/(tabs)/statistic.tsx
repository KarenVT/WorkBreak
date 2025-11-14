import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function StatisticScreen() {
    const [breaksToday, setBreaksToday] = useState(0);
    const [focusTime, setFocusTime] = useState(0); // en minutos
    const [streakDays, setStreakDays] = useState(0);

    useEffect(() => {
        const cargarEstadisticas = async () => {
            try {
                const descansos = await AsyncStorage.getItem('breaksToday');
                const tiempo = await AsyncStorage.getItem('focusTime');
                const racha = await AsyncStorage.getItem('streakDays');

                setBreaksToday(descansos ? parseInt(descansos) : 0);
                setFocusTime(tiempo ? parseInt(tiempo) : 0);
                setStreakDays(racha ? parseInt(racha) : 0);
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }
        };

        cargarEstadisticas();
    }, []);

    const data = {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
            {
                data: [3, 4, 2, 5, 1, 0, 0], // Simulado: puedes reemplazar con datos reales
            },
        ],
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>📈 Progreso</Text>

            <View style={styles.metrics}>
                <Text style={styles.metric}>
                    🧘 Descansos completados hoy: <Text style={styles.value}>{breaksToday}</Text>
                </Text>
                <Text style={styles.metric}>
                    ⏱️ Tiempo total de enfoque: <Text style={styles.value}>{focusTime} min</Text>
                </Text>
                <Text style={styles.metric}>
                    🔥 Racha de días activos: <Text style={styles.value}>{streakDays} días</Text>
                </Text>
            </View>

            <Text style={styles.subtitle}>📊 Actividad semanal</Text>
            <BarChart
                data={data}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#f0f0f0',
                    backgroundGradientTo: '#d0d0d0',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                    labelColor: () => '#333',
                }}
                style={{ borderRadius: 10 }}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
    },
    metrics: {
        marginBottom: 20,
    },
    metric: {
        fontSize: 16,
        marginBottom: 5,
    },
    value: {
        fontWeight: 'bold',
        color: '#007AFF',
    },
});
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ProfilScreen() {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profil screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B1220',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});
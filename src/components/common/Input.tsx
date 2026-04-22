import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, BORDER_RADIUS, FONT_SIZE, SPACING } from '../../theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: string;
    password?: boolean;
    onIconPress?: () => void;
}

const Input = ({
    label,
    error,
    icon,
    password,
    onIconPress,
    style,
    ...props
}: InputProps) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error ? styles.errorBorder : null]}>
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={COLORS.text.muted}
                    secureTextEntry={password && !isPasswordVisible}
                    {...props}
                />
                {password && (
                    <TouchableOpacity
                        style={styles.icon}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        <Icon
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.text.muted}
                        />
                    </TouchableOpacity>
                )}
                {icon && !password && (
                    <TouchableOpacity style={styles.icon} onPress={onIconPress}>
                        <Icon name={icon} size={20} color={COLORS.text.muted} />
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        height: 48,
    },
    input: {
        flex: 1,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        height: '100%',
    },
    icon: {
        padding: SPACING.sm,
    },
    errorBorder: {
        borderColor: COLORS.error,
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.xs,
        marginTop: SPACING.xs,
    },
});

export default Input;

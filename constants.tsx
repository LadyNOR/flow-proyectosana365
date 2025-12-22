
import React from 'react';
import { Track, SOSOption, Badge } from './types';

export const PASSCODE = "FLOW2025";
export const PREMIUM_CODE = "SANA365_PREMIUM"; 

/**
 * GUÍA PARA AGREGAR AUDIOS MENSUALES:
 * ---------------------------------
 * 1. Sube el archivo .mp3 a la carpeta 'audio'.
 * 2. Copia un bloque de los de abajo (desde '{' hasta '},').
 * 3. Pégalo justo antes del último corchete ']'.
 * 4. Cambia el 'id' (número siguiente), el 'title' y el 'src' (nombre del archivo).
 */
export const TRACKS: Track[] = [
  { 
    id: '1',
    title: "01. Merezco Fluir (Metáfora)", 
    type: "audio", 
    src: "audio/merezco_fluir.mp3", 
    isLocked: false,
    intent: "Neuro-programación para soltar el control."
  },
  { 
    id: '2',
    title: "02. La Montaña (Resiliencia)", 
    type: "song",
    src: "audio/la_montana.mp3", 
    isLocked: false,
    intent: "PNL aplicada a la estabilidad emocional."
  },
  { 
    id: '3',
    title: "03. El Río Interior (Premium)", 
    type: "song", 
    src: "audio/rio_interior.mp3", 
    isLocked: true,
    intent: "Desbloqueo de creatividad cuántica."
  },
  { 
    id: '4',
    title: "04. Fuego de Acción (Premium)", 
    type: "audio", 
    src: "audio/fuego_accion.mp3", 
    isLocked: true,
    intent: "Activación epigenética de la voluntad."
  },
  { 
    id: '5',
    title: "05. Sanación Cuántica (Enero)", 
    type: "audio", 
    src: "audio/sanacion_enero.mp3", 
    isLocked: true,
    intent: "Reprogramación de patrones de escasez (Premium Enero)."
  }
];

export const SOS_OPTIONS: SOSOption[] = [
  { 
    icon: "🌬️", 
    title: "Respiración 4-7-8", 
    subtitle: "Calma inmediata del sistema nervioso.", 
    steps: ["Inhala por la nariz (4s)", "Retén el aire (7s)", "Exhala ruidosamente (8s)", "Repite 4 veces"] 
  },
  { 
    icon: "👀", 
    title: "Grounding 5-4-3-2-1", 
    subtitle: "Vuelve al presente cuando la ansiedad ataca.", 
    steps: ["Nombra 5 cosas que veas", "4 cosas que puedas tocar", "3 sonidos que escuches", "2 olores", "1 sabor"] 
  },
  { 
    icon: "🦁", 
    title: "Suspiro Fisiológico", 
    subtitle: "Reset biológico del estrés.", 
    steps: ["Inhalación profunda", "Segunda inhalación corta al final", "Exhalación muy larga por la boca", "Libera el pecho"] 
  },
  { 
    icon: "🕺", 
    title: "Sacudida (Shaking)", 
    subtitle: "Libera el exceso de cortisol.", 
    steps: ["Ponte de pie", "Sacude tus manos vigorosamente", "Sacude tus pies", "Sacude todo el cuerpo por 30 segundos"] 
  }
];

export const BADGES: Badge[] = [
  { days: 1, title: "Semilla", icon: "🌱", desc: "Has dado el primer paso." },
  { days: 3, title: "Brote", icon: "🌿", desc: "La constancia empieza a notarse." },
  { days: 7, title: "Impulso", icon: "🚀", desc: "Una semana de flujo cuántico." },
  { days: 14, title: "Diamante", icon: "💎", desc: "El hábito se está cristalizando." },
  { days: 30, title: "Maestro", icon: "👑", desc: "Un mes de sanación consciente." },
  { days: 90, title: "Renacido", icon: "🦋", desc: "Tu sistema nervioso ha cambiado." },
  { days: 365, title: "Leyenda PS365", icon: "🌟", desc: "Un año de soberanía personal." }
];

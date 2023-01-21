export type AcDc = 'DC' | 'AC'| null;
export type Unit = 'V' | 'A' | 'Hz' | '%' | 'F' | '°C' | '°F' | 'Ohm' | null;
export interface DmmMode {
    minMaxMode: 'min'| 'max' | null;
        isAutoRange: boolean;
        acDc: AcDc;
        isRelative: boolean;
        isHold: boolean;
        mode: 'Voltage' |'Current' | 'Frequency' | 'Duty cycle' | 'Capacitance' | 'Temperature in °C' | 'Temperature in °F' | 'Diode' | 'Continuity' | 'Resistance' | null;
        unit: Unit;
}

export interface DmmPrefix {
    prefix: 'n' | 'u' | 'm' | 'k' | 'M' | '';
    value: number;
}

export interface DmmValue {
    display: {
        value: number;
        unit: string;
        acDc: AcDc;
        text: string;
    };
    real: {
        value: number;
        unit: Unit;
        acDc: AcDc;
    }
}

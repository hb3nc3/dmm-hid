import {DmmMode, DmmPrefix, DmmValue} from "./models/victordecoder.model";

export class VictorEncodedValue {
    private readonly KEY = 'jodenxunickxia';
    private readonly NEWPOS = [6,13,5,11,2,7,9,8,3,10,12,0,4,1];
    private readonly payload: Buffer = new Buffer(14);

    constructor(buf: Buffer) {
        this.KEY.split('').forEach((x,i) => {
            this.payload[this.NEWPOS[i]] = buf[i] - x.charCodeAt(0);
        })
    }

    isValid(): boolean {
        return this.payload[0] !== 0x50;
    }
    private getBit(byte: number, bit: number): boolean {
        return !!(this.payload[byte] & (1 << bit));
    }
    getMode(): DmmMode {
        const isVoltage = this.getBit(3, 0);
        const isCurrent = this.getBit(3, 1);
        const isResistance = this.getBit(3, 2);
        const isFrequency = this.getBit(3, 4);
        const isCapacitance = this.getBit(3, 5);
        const isTempC = this.getBit(3, 6);
        const isTempF = this.getBit(3, 7);
        const isContinuity = this.getBit(4, 4); // combination with resistance
        const isDiode = this.getBit(4, 5); // combination with resistance
        const isDutyCycle = this.getBit(4, 6); // combination with resistance
        const isMaxMode = this.getBit(5, 2);
        const isMinMode = this.getBit(5, 3);
        const isAutoRange = this.getBit(6, 2);
        const isDC = this.getBit(6, 3);
        const isAC = this.getBit(6, 4);
        const isRelative = this.getBit(6, 5);
        const isHold = this.getBit(6, 6);
        return {
            minMaxMode: isMinMode ? 'min' : isMaxMode ? 'max' : null,
            isAutoRange,
            acDc: isDC ? 'DC' : isAC? 'AC' : null,
            isRelative,
            isHold,
            mode: isDiode && isVoltage ? 'Diode' :
                isCurrent ? 'Current' :
                    isFrequency ? 'Frequency' :
                        isDutyCycle ? 'Duty cycle' :
                            isCapacitance ? 'Capacitance' :
                                isTempC ? 'Temperature in °C' :
                                    isTempF ? 'Temperature in °F' :
                                        isVoltage ? 'Voltage' :
                                            isContinuity && isResistance ? 'Continuity' :
                                                isResistance ? 'Resistance' : null,
            unit: isDiode && isVoltage ? 'V' :
                isCurrent ? 'A' :
                    isFrequency ? 'Hz' :
                        isDutyCycle ? '%' :
                            isCapacitance ? 'F' :
                                isTempC ? '°C' :
                                    isTempF ? '°F' :
                                        isVoltage ? 'V' :
                                            isContinuity && isResistance ? 'Ohm' :
                                                isResistance ? 'Ohm' : null
        }
    }
    getPrefix(): DmmPrefix {
        const isNano = this.getBit(5, 6)
        const isMicro = this.getBit(4, 0)
        const isMilli = this.getBit(4, 1)
        const isKilo = this.getBit(4, 2)
        const isMega = this.getBit(4, 3)
        return {
            prefix: isNano ? 'n' :
                isMicro ? 'u' :
                    isMilli ? 'm' :
                        isKilo ? 'k' :
                            isMega ? 'M' : '',
            value: isNano ? 10E-9 :
                isMicro ? 10E-6 :
                    isMilli ? 10E-3 :
                        isKilo ? 10E2 :
                            isMega ? 10E3 : 1,
        }
    }
    getValue(): DmmValue {
        const decimalPoint = (this.payload[7] & 0b11110000) >> 4;
        const isNegative = this.getBit(2, 0);
        const map: {[x: number]:number} = {0xC:0,0x8C:1,0x4C:2,0xCC:3,0x2C:4,0xAC:5,0x6C:6,0xEC:7,0x1C:8,0x9C:9};
        const digit3 = map[this.payload[12]];
        const digit2 = map[this.payload[11]];
        const digit1 = map[this.payload[10]];
        const digit0 = map[this.payload[9]];
        const value = (isNegative ? -1 : 1) * parseFloat(`${digit3}${decimalPoint === 8 ? '.' : ''}${digit2}${decimalPoint === 4 ? '.' : ''}${digit1}${decimalPoint === 2 ? '.' : ''}${digit0}}`);
        const mode = this.getMode();
        const prefix = this.getPrefix();
        return {
            display: {
                value,
                unit: `${prefix.prefix}${mode.unit}`,
                acDc: mode.acDc,
                text: `${value} ${prefix.prefix}${mode.unit}${mode.acDc ? ' ' + mode.acDc : ''}`
            },
            real: {
                value: value * prefix.value,
                unit: mode.unit,
                acDc: mode.acDc
            }
        }
    }
}

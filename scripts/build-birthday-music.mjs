import { writeFileSync } from 'node:fs';

const sampleRate = 22050;
const beat = 60 / 92;
const progression = [
    [48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [43, 50, 55, 59],
    [41, 48, 53, 57], [40, 48, 52, 55], [43, 50, 55, 57], [43, 50, 55, 59],
    [48, 55, 60, 64], [47, 55, 59, 62], [45, 52, 57, 60], [43, 50, 55, 59],
    [41, 48, 53, 57], [40, 48, 52, 55], [43, 50, 55, 59], [48, 55, 60, 64],
];
const melody = [
    [[0.5, 67], [1, 72], [2, 76]], [[0, 74], [1.5, 71]], [[0, 72], [1, 76], [2, 79]], [[0, 74], [1.5, 71]],
    [[0, 69], [1, 72], [2, 77]], [[0, 76], [1.5, 72]], [[0, 69], [1, 67], [2, 69]], [[0, 71], [1.5, 74]],
    [[0, 76], [1, 79], [2, 84]], [[0, 83], [1.5, 79]], [[0, 81], [1, 79], [2, 76]], [[0, 74], [1.5, 71]],
    [[0, 72], [1, 77], [2, 76]], [[0, 72], [1.5, 67]], [[0, 69], [1, 71], [2, 74]], [[0, 72]],
];
const samples = new Float32Array(Math.round(progression.length * 3 * beat * sampleRate));

function playNote(midi, start, volume, decay, brightness) {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const angularFrequency = 2 * Math.PI * frequency;
    const offset = Math.round(start * sampleRate);
    const duration = Math.min(samples.length - offset, Math.round(3.3 * sampleRate));
    for (let index = 0; index < duration; index++) {
        const time = index / sampleRate;
        const phase = angularFrequency * time;
        const attack = 1 - Math.exp(-time * 155);
        const fundamental = Math.sin(phase) + 0.055 * Math.sin(phase * 1.003);
        const harmonics = Math.exp(-time * 2.7) * (0.29 * Math.sin(phase * 2.002) + 0.12 * Math.sin(phase * 3.006));
        samples[offset + index] += volume * attack * Math.exp(-time * decay) * (fundamental + brightness * harmonics);
    }
}

for (const [bar, chord] of progression.entries()) {
    const start = bar * 3 * beat;
    playNote(chord[0], start, 0.1, 2.3, 0.55);
    for (const [index, note] of chord.slice(1).entries()) {
        playNote(note, start + (1.02 + index * 0.36) * beat, 0.057, 2.6, 0.53);
    }
    for (const [position, note] of melody[bar]) {
        playNote(note, start + position * beat, 0.19, 1.75, 0.86);
    }
}

const wav = Buffer.alloc(44 + samples.length * 2);
wav.write('RIFF');
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(samples.length * 2, 40);

const firstReflection = Math.round(sampleRate * 0.071);
const secondReflection = Math.round(sampleRate * 0.129);
for (let index = 0; index < samples.length; index++) {
    const room = (samples[index - firstReflection] ?? 0) * 0.18 + (samples[index - secondReflection] ?? 0) * 0.11;
    const fade = Math.min(1, (samples.length - index - 1) / (0.42 * sampleRate));
    wav.writeInt16LE(Math.round((samples[index] + room) * fade * 28000), 44 + index * 2);
}

writeFileSync(new URL('../public/birthday/piano-waltz.wav', import.meta.url), wav);

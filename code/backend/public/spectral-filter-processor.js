class SpectralFilterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // FFT setup
    this.fftSize = 512;
    this.hopSize = this.fftSize / 4; // 75% overlap

    // Buffer for overlapping blocks
    this.inputBuffer = new Float32Array(this.fftSize);
    this.outputBuffer = new Float32Array(this.fftSize);

    // Window function (Hann window)
    this.window = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / this.fftSize));
    }

    // Real and imaginary parts for the FFT
    this.real = new Float32Array(this.fftSize);
    this.imag = new Float32Array(this.fftSize);

    // Buffers for inverse FFT
    this.tempReal = new Float32Array(this.fftSize);
    this.tempImag = new Float32Array(this.fftSize);

    // Processing state
    this.bufferFill = 0;
    this.processingEnabled = false;

    // Cutoff frequency (normalized 0-1)
    this.cutoffFreq = 0.25; // Default: 25% of Nyquist frequency

    // Listen for parameter changes
    this.port.onmessage = event => {
      if (event.data.type === 'setProcessing') {
        this.processingEnabled = event.data.enabled;
        console.log(
          'FFT processing:',
          this.processingEnabled ? 'enabled' : 'disabled',
        );
      } else if (event.data.type === 'setCutoff') {
        this.cutoffFreq = event.data.cutoff;
        console.log('Cutoff frequency set to:', this.cutoffFreq);
      }
    };
  }

  // FFT implementation
  fft(real, imag) {
    const n = real.length;

    // Bit reversal permutation
    for (let i = 0, j = 0; i < n; i++) {
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
      let m = n >> 1;
      while (m >= 1 && j & m) {
        j -= m;
        m >>= 1;
      }
      j += m;
    }

    // Cooley-Tukey decimation-in-time FFT
    for (let s = 1; s < n; s <<= 1) {
      const m = s << 1;
      const wPhaseStep = -Math.PI / s;

      for (let k = 0; k < s; k++) {
        const wPhase = k * wPhaseStep;
        const wReal = Math.cos(wPhase);
        const wImag = Math.sin(wPhase);

        for (let i = k; i < n; i += m) {
          const j = i + s;

          const tempReal = wReal * real[j] - wImag * imag[j];
          const tempImag = wReal * imag[j] + wImag * real[j];

          real[j] = real[i] - tempReal;
          imag[j] = imag[i] - tempImag;
          real[i] += tempReal;
          imag[i] += tempImag;
        }
      }
    }

    return [real, imag];
  }

  // Inverse FFT
  ifft(real, imag) {
    // Conjugate
    for (let i = 0; i < imag.length; i++) {
      imag[i] = -imag[i];
    }

    // Forward FFT
    this.fft(real, imag);

    // Conjugate again and scale
    const n = real.length;
    for (let i = 0; i < n; i++) {
      real[i] /= n;
      imag[i] = -imag[i] / n;
    }

    return [real, imag];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0][0];
    const output = outputs[0][0];

    if (!input || !output) return true;

    // Shift input buffer and add new samples
    this.inputBuffer.set(this.inputBuffer.subarray(input.length));
    this.inputBuffer.set(input, this.fftSize - input.length);

    // Copy output from buffer (with overlap-add)
    for (let i = 0; i < input.length; i++) {
      output[i] = this.outputBuffer[i];
      this.outputBuffer[i] = this.outputBuffer[i + input.length];
      this.outputBuffer[i + input.length] = 0;
    }

    // Increment buffer fill counter
    this.bufferFill += input.length;

    // Process when we have enough samples
    if (this.bufferFill >= this.hopSize) {
      this.bufferFill = 0;

      // Apply window and prepare for FFT
      for (let i = 0; i < this.fftSize; i++) {
        this.real[i] = this.inputBuffer[i] * this.window[i];
        this.imag[i] = 0;
      }

      // Perform FFT
      this.fft(this.real, this.imag);

      // Spectral processing if enabled
      if (this.processingEnabled) {
        const nyquist = sampleRate / 2;
        const cutoffHz = this.cutoffFreq * nyquist; // e.g. 0.25 * 24000 = 6kHz
        const cutoffBin = Math.floor(this.cutoffFreq * this.fftSize);
        
        for (let i = 0; i < this.fftSize; i++) {
          let attenuation = 1.0;
        
          if (i > cutoffBin) {
            const fade = (i - cutoffBin) / (this.fftSize - cutoffBin);
            attenuation = 1.0 - 0.8 * Math.min(fade, 1); // smoothly reduce by up to 80%
          }
        
          this.tempReal[i] = this.real[i] * attenuation;
          this.tempImag[i] = this.imag[i] * attenuation;
        }
      } else {
        // If processing is disabled, just copy the spectrum
        this.tempReal.set(this.real);
        this.tempImag.set(this.imag);
      }

      // Perform inverse FFT
      this.ifft(this.tempReal, this.tempImag);

      // Apply window again and overlap-add to output buffer
      for (let i = 0; i < this.fftSize; i++) {
        this.outputBuffer[i] += this.tempReal[i] * this.window[i];
      }
    }

    // Always continue processing
    return true;
  }
}

registerProcessor('spectral-filter-processor', SpectralFilterProcessor);

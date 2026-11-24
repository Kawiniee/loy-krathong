export type AudioSettings = { water: boolean; music: boolean; effects: boolean }

class FestivalAudio {
  private context?: AudioContext
  private ambience?: AudioBufferSourceNode
  private water?: GainNode
  private melody?: ReturnType<typeof setInterval>
  private index = 0
  private effects = false

  async configure(settings: AudioSettings) {
    this.effects = settings.effects
    if (Object.values(settings).some(Boolean)) {
      this.context ??= new AudioContext()
      await this.context.resume()
    }
    const context = this.context
    if (!context) return
    if (settings.water && !this.ambience) {
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate)
      const stream = buffer.getChannelData(0)
      let sample = 0
      for (let i = 0; i < stream.length; i++) {
        sample = (sample + (Math.random() * 2 - 1) * .03) / 1.03
        stream[i] = sample * (.58 + .28 * Math.sin(i * Math.PI * 4 / stream.length))
      }
      this.ambience = context.createBufferSource()
      this.ambience.buffer = buffer
      this.ambience.loop = true
      this.water = context.createGain()
      this.water.gain.value = .24
      this.ambience.connect(this.water).connect(context.destination)
      this.ambience.start()
    } else if (!settings.water && this.ambience) {
      this.ambience.stop()
      this.ambience.disconnect()
      this.water?.disconnect()
      this.ambience = undefined
    }
    if (!settings.music && this.melody) {
      clearInterval(this.melody)
      this.melody = undefined
    } else if (settings.music && !this.melody) {
      const notes = [293.66, 440, 392, 523.25, 440, 329.63, 392, 293.66]
      const play = () => this.note(notes[this.index++ % notes.length], .028, 1.2, 'sine')
      play()
      this.melody = setInterval(play, 1900)
    }
  }

  private note(frequency: number, volume: number, duration: number, shape: OscillatorType) {
    const context = this.context
    if (!context || context.state !== 'running') return
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = shape
    osc.frequency.value = frequency
    const start = context.currentTime
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + .02)
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    osc.connect(gain).connect(context.destination)
    osc.start()
    osc.stop(start + duration + .02)
  }

  tap() { if (this.effects) this.note(660, .037, .19, 'triangle') }
}

export const audio = new FestivalAudio()
export const mutedAudio = { water: false, music: false, effects: false }

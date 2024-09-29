import { Mutex } from 'async-mutex';

export class PlayPlayKey {
    private playPlayModule: any;
    private mutex: Mutex;

    private constructor(playPlayModule: any) {
        this.playPlayModule = playPlayModule;
        this.mutex = new Mutex();
    }

    public static async Create() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { default: PlayPlayModule } = await import('./playplaymodule/playplaymodule.js');
        
        const playPlayModule = await PlayPlayModule();
        return new PlayPlayKey(playPlayModule);
    }

    public async processKeys(fileId: Uint8Array, obfuscatedKey: Uint8Array): Promise<Uint8Array> {
        return await this.mutex.runExclusive(() => {
            this.playPlayModule.HEAPU8.set(fileId, 0);
            this.playPlayModule.HEAPU8.set(obfuscatedKey, 32);
    
            const boundKeyPtr = this.playPlayModule._process_keys(0, 32);
            const boundKey = new Uint8Array(this.playPlayModule.HEAPU8.buffer, boundKeyPtr, 16);
    
            return boundKey;
        });
    }

}
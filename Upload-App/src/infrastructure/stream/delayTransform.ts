import { Transform, type TransformCallback } from 'stream';

export class DelayTransform extends Transform {
    constructor(private delayMs: number) { 
        super();
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
        setTimeout(() => {            
            callback(null, chunk);
        }, this.delayMs);
    }
}

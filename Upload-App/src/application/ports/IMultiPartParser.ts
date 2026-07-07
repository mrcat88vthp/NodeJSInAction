import type { MultiPartParserInputDTO } from "@/application/ports/DTOs/MultiPartParserDTO.ts";

export interface IMultiPartParser {
    parse (
        req: NodeJS.ReadableStream,
        headers: Record<string, string>,
        onFile: (input: MultiPartParserInputDTO) => Promise<void>
    ): Promise<void>;
}
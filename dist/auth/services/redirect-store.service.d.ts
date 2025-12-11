export declare class RedirectStoreService {
    private redirectMap;
    private readonly TTL;
    set(stateId: string, redirectUri: string): void;
    get(stateId: string): string | undefined;
    clear(): void;
}

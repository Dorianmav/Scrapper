// Configuration des logs pour différents environnements
export class Logger {
    private static isDevelopment = process.env.NODE_ENV !== 'production';
    private static isDebugEnabled = process.env.DEBUG_LOGS === 'true';

    static info(message: string, data?: any) {
        if (this.isDevelopment) {
            if (data) {
                console.log(message, data);
            } else {
                console.log(message);
            }
        }
    }

    static debug(message: string, data?: any) {
        if (this.isDevelopment && this.isDebugEnabled) {
            if (data) {
                console.log(`🔍 DEBUG: ${message}`, data);
            } else {
                console.log(`🔍 DEBUG: ${message}`);
            }
        }
    }

    static error(message: string, error?: any) {
        // Les erreurs sont toujours affichées
        if (error) {
            console.error(`❌ ${message}`, error);
        } else {
            console.error(`❌ ${message}`);
        }
    }

    static success(message: string, data?: any) {
        if (this.isDevelopment) {
            if (data) {
                console.log(`✅ ${message}`, data);
            } else {
                console.log(`✅ ${message}`);
            }
        }
    }

    static warning(message: string, data?: any) {
        if (this.isDevelopment) {
            if (data) {
                console.warn(`⚠️ ${message}`, data);
            } else {
                console.warn(`⚠️ ${message}`);
            }
        }
    }

    // Log sécurisé pour la production (sans données sensibles)
    static production(message: string) {
        if (!this.isDevelopment) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownCommand = void 0;
const nest_commander_1 = require("nest-commander");
const child_process_1 = require("child_process");
const path_1 = require("path");
let DownCommand = class DownCommand extends nest_commander_1.CommandRunner {
    async run() {
        console.log('🛑 Parando serviços...\n');
        try {
            console.log('📦 Parando servidor NestJS...');
            try {
                (0, child_process_1.execSync)("pkill -f 'nest start' || true", { stdio: 'ignore' });
                (0, child_process_1.execSync)("pkill -f 'node.*dist/main' || true", { stdio: 'ignore' });
            }
            catch (error) {
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                const portProcess = (0, child_process_1.execSync)('lsof -ti:3000 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
                if (portProcess) {
                    console.log('⚠️  Ainda há processos na porta 3000, forçando parada...');
                    (0, child_process_1.execSync)(`kill -9 ${portProcess} 2>/dev/null || true`, { stdio: 'ignore' });
                }
            }
            catch (error) {
            }
            console.log('🐳 Parando containers Docker...');
            const projectRoot = (0, path_1.join)(__dirname, '../..');
            (0, child_process_1.execSync)('docker-compose down', {
                cwd: projectRoot,
                stdio: 'inherit',
            });
            console.log('\n✅ Todos os serviços foram parados!');
        }
        catch (error) {
            console.error('❌ Erro ao parar serviços:', error.message);
            process.exit(1);
        }
    }
};
exports.DownCommand = DownCommand;
exports.DownCommand = DownCommand = __decorate([
    (0, nest_commander_1.Command)({
        name: 'service:down',
        description: 'Para todos os serviços (NestJS e Docker Compose)',
    })
], DownCommand);
//# sourceMappingURL=down.command.js.map
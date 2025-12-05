import { Command, CommandRunner } from 'nest-commander';
import { execSync } from 'child_process';
import { join } from 'path';

@Command({
  name: 'service:down',
  description: 'Para todos os serviços (NestJS e Docker Compose)',
})
export class DownCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('🛑 Parando serviços...\n');

    try {
      // Parar processos do NestJS
      console.log('📦 Parando servidor NestJS...');
      try {
        execSync("pkill -f 'nest start' || true", { stdio: 'ignore' });
        execSync("pkill -f 'node.*dist/main' || true", { stdio: 'ignore' });
      } catch (error) {
        // Ignorar erros se não houver processos
      }

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar e parar processos na porta 3000
      try {
        const portProcess = execSync('lsof -ti:3000 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
        if (portProcess) {
          console.log('⚠️  Ainda há processos na porta 3000, forçando parada...');
          execSync(`kill -9 ${portProcess} 2>/dev/null || true`, { stdio: 'ignore' });
        }
      } catch (error) {
        // Ignorar erros
      }

      // Derrubar Docker Compose
      console.log('🐳 Parando containers Docker...');
      const projectRoot = join(__dirname, '../..');
      execSync('docker-compose down', {
        cwd: projectRoot,
        stdio: 'inherit',
      });

      console.log('\n✅ Todos os serviços foram parados!');
    } catch (error) {
      console.error('❌ Erro ao parar serviços:', error.message);
      process.exit(1);
    }
  }
}


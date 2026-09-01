import handler from '../api/cron-sla.js';

async function runLocalCronTest() {
  console.log('🧪 Testando execução do Vercel Cron SLA localmente...');
  const req = {};
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log('✅ Resposta da Serverless Function (Status ' + (this.statusCode || 200) + '):', JSON.stringify(data, null, 2));
      return data;
    }
  };

  await handler(req, res);
}

runLocalCronTest();

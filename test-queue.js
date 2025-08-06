const axios = require('axios');

// Configuração
const API_BASE_URL = 'http://localhost:3000/api/video';
const TEST_VIDEOS = [
    {
        link: 'https://drive.google.com/file/d/1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P/view',
        title: 'Vídeo Teste 1',
        pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz',
        transkriptor: true
    },
    {
        link: 'https://drive.google.com/file/d/1VRkdbMtF3vgEkIl1dwdBVlZdMtGkwydf/view',
        title: 'Vídeo Teste 2',
        pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz',
        transkriptor: true
    },
    {
        link: 'https://drive.google.com/file/d/1PG3WMvaXSVD0wrIXihNccwG0zTgXXCVx/view',
        title: 'Vídeo Teste 3',
        pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz',
        transkriptor: false
    },
    {
        link: 'https://drive.google.com/file/d/17o093NBiVZY3jcw5BHgR0S0_7o_6AwvZ/view',
        title: 'Vídeo Teste 4',
        pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz',
        transkriptor: true
    },
    {
        link: 'https://drive.google.com/file/d/15fyqHfAoytHnFe64euzBVWAraeErIGnZ/view',
        title: 'Vídeo Teste 5',
        pasta_drive: 'https://drive.google.com/drive/u/0/folders/1s_qJ1w7tlSxf1WcCgrSWTkUf1A4PG9Yz',
        transkriptor: false
    }
];

// Função para adicionar vídeo à fila
async function addVideoToQueue(videoData) {
    try {
        console.log(`📥 Adicionando vídeo à fila: ${videoData.title}`);
        
        const response = await axios.post(API_BASE_URL, {
            link: videoData.link,
            pasta_drive: videoData.pasta_drive,
            transkriptor: videoData.transkriptor,
            use_queue: true
        });
        
        console.log(`✅ Resposta para ${videoData.title}:`, {
            success: response.data.success,
            message: response.data.message,
            queue_info: response.data.queue_info
        });
        
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao adicionar ${videoData.title}:`, error.response?.data || error.message);
        return null;
    }
}

// Função para verificar status da fila
async function checkQueueStatus() {
    try {
        const response = await axios.get(`${API_BASE_URL}/queue/status`);
        console.log('📊 Status da fila:', response.data.queue);
        return response.data.queue;
    } catch (error) {
        console.error('❌ Erro ao verificar status da fila:', error.response?.data || error.message);
        return null;
    }
}

// Função para verificar estatísticas da fila
async function checkQueueStats() {
    try {
        const response = await axios.get(`${API_BASE_URL}/queue/stats`);
        console.log('📈 Estatísticas da fila:', response.data.stats);
        return response.data.stats;
    } catch (error) {
        console.error('❌ Erro ao verificar estatísticas da fila:', error.response?.data || error.message);
        return null;
    }
}

// Função principal de teste
async function runQueueTest() {
    console.log('🚀 Iniciando teste do sistema de fila...\n');
    
    // Verificar status inicial
    console.log('📊 Status inicial da fila:');
    await checkQueueStatus();
    console.log('');
    
    // Adicionar vídeos à fila
    console.log('📥 Adicionando vídeos à fila...\n');
    
    const promises = TEST_VIDEOS.map(video => addVideoToQueue(video));
    const results = await Promise.all(promises);
    
    console.log('\n📊 Status após adicionar vídeos:');
    await checkQueueStatus();
    console.log('');
    
    // Monitorar processamento
    console.log('🔄 Monitorando processamento...\n');
    
    let processingComplete = false;
    let checkCount = 0;
    const maxChecks = 30; // Máximo de verificações
    
    while (!processingComplete && checkCount < maxChecks) {
        checkCount++;
        
        const stats = await checkQueueStats();
        if (stats) {
            console.log(`📈 Verificação ${checkCount}: Processadores ativos: ${stats.activeProcessors}, Fila: ${stats.queueSize}, Processados: ${stats.totalProcessed}`);
            
            // Verificar se o processamento terminou
            if (stats.queueSize === 0 && stats.activeProcessors === 0) {
                processingComplete = true;
                console.log('✅ Processamento concluído!');
            }
        }
        
        // Aguardar 5 segundos antes da próxima verificação
        if (!processingComplete) {
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    // Status final
    console.log('\n📊 Status final:');
    await checkQueueStatus();
    
    console.log('\n🎉 Teste do sistema de fila concluído!');
}

// Executar teste
if (require.main === module) {
    runQueueTest().catch(console.error);
}

module.exports = {
    addVideoToQueue,
    checkQueueStatus,
    checkQueueStats,
    runQueueTest
}; 
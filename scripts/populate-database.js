const videoDatabase = require('../services/video-database');

async function populateDatabase() {
  try {
    console.log('🚀 Inicializando população do banco de dados...');
    
    // Carregar banco de dados
    await videoDatabase.loadDatabase();
    
    // IDs pré-definidos fornecidos pelo usuário
    const predefinedIds = [
      '1iEW5cQoQ6dKkudE4EMHqOPJNMPK4Va-P',
      '1VRkdbMtF3vgEkIl1dwdBVlZdMtGkwydf',
      '1PG3WMvaXSVD0wrIXihNccwG0zTgXXCVx',
      '17o093NBiVZY3jcw5BHgR0S0_7o_6AwvZ',
      '15fyqHfAoytHnFe64euzBVWAraeErIGnZ',
      '1IWs9uWwhI6RRzYfIAhOm-4TWsCEFmJTG',
      '14dBt04E0Aw99EJz3o931y1ckesnCbLlo',
      '1wPX-4psAWFRA9nytV9HYrchObqI2nmYM',
      '12jWFsZiRqWAaW_6hX45oMo4CzRDbZLOC',
      '1mjRa9HBu4onJY2IojObjWezObOnfZncm',
      '1xSVrHf86r5dSEwW8gy5r_L-j3fGLfRJd',
      '1zTAWEtIPpho5KGt14bJQFONaJgazHKZl',
      '19NgVfjEZl7VX0otiwKuIn6RSy0S9SZht',
      '1ih3wY2bShULlGP5-UY1W_F4W3nGYIDsX'
    ];
    
    console.log(`📋 Adicionando ${predefinedIds.length} IDs pré-definidos...`);
    
    let added = 0;
    let skipped = 0;
    
    for (const id of predefinedIds) {
      // Criar URL fictícia para o Google Drive
      const fakeUrl = `https://drive.google.com/file/d/${id}/view`;
      
      // Verificar se já existe
      if (videoDatabase.isVideoProcessed(fakeUrl)) {
        console.log(`⏭️ ID já existe no banco: ${id}`);
        skipped++;
        continue;
      }
      
      // Adicionar ao banco
      await videoDatabase.addProcessedVideo(
        fakeUrl,
        `Vídeo Pré-definido ${id}`,
        null, // sem transkriptor ID
        `video_${id}.m4a`
      );
      
      console.log(`✅ ID adicionado: ${id}`);
      added++;
    }
    
    // Salvar banco de dados
    await videoDatabase.saveDatabase();
    
    console.log('\n📊 Resumo da população:');
    console.log(`   ✅ Adicionados: ${added}`);
    console.log(`   ⏭️ Pulados: ${skipped}`);
    console.log(`   📋 Total no banco: ${videoDatabase.getStats().total_processed}`);
    
    console.log('\n🎉 População do banco de dados concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateDatabase();
}

module.exports = populateDatabase; 
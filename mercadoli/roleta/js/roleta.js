$(document).ready(function(){
  let loading = false; // Variável para controlar se a roleta está girando

  const options = [
    {
      title: `Tente outra vez`,
      subtitle: 'Tente outra vez',
      color: '#000',
      retry: true,
    },
    {
      title: '75%',
      subtitle: 'DE DESCONTO',
      color: '#02ADA0',
    },
    {
      title: '50%',
      subtitle: 'DE DESCONTO',
      color: '#FF3D6A',
    },
    {
      title: '95%',
      subtitle: 'DE DESCONTO',
      color: '#FFCA00',
    },
    {
      title: `Tente outra vez`,
      subtitle: 'Tente outra vez',
      color: '#000',
      retry: true,
    },
    {
      title: '15%',
      subtitle: 'DE DESCONTO',
      color: '#02B1DC',
    },
    {
      title: '25%',
      subtitle: 'DE DESCONTO',
      color: '#FF2727',
    }
  ]

  var rouletteWidth = 360;
  var optionsLength = options.length;
  var angleOption = 360 / optionsLength;
  var degrees = (180 - angleOption) / 2;
  var heightAngle = Math.tan(degrees * Math.PI / 180) * (rouletteWidth / 2);
  let rotated = 0;
  const chances = [0, 3]

  $(".roleta").css({
    'width' : rouletteWidth + 'px',
    'height' : rouletteWidth + 'px'
  })

  $('head').append('<style id="afterNumero"></style>');
  
  for(var i=0; i<=optionsLength - 1; i++){
    const currOption = options[i]

    $(".roleta").append(`<div class="option option-${i} ${currOption.retry ? 'retry' : ''}"></div>`);
    var clasS = '.option-' + i;
    
    $(clasS).css({
      'transform' : 'rotate(' + angleOption * i + 'deg)',
      'border-bottom-color' : currOption?.color
    });
    $('#afterNumero').append(`.option-${i}::before {content: "${currOption.title}"}`);
    if (!currOption.retry) {
      $('#afterNumero').append(`.option-${i}::after {content: "${currOption.subtitle}"}`);
    }
    
    $(".option")
      .attr('data-content', currOption?.title)
      .attr('data-ancho', (rouletteWidth / 2) + 'px')
      .attr('data-line', (rouletteWidth / 2) + 'px');
  }
  

  $(".option").css({
    'border-bottom-width' : heightAngle + 'px',
    'border-right-width' : (rouletteWidth / 2) + 'px',
    'border-left-width' : (rouletteWidth / 2) + 'px'
  })
  
  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  function spinRoulette() {
    if (loading) {
      return; // Se a roleta já estiver girando, não faz nada
    }
    loading = true; // Define que a roleta está girando

    var num;
    var numID = 'number-';
    num = chances[rotated];
    numID += num;
    
    $('#animacaoRoleta').remove();
    $('head').append('<style id="animacaoRoleta">'+
        '#number-'+ num +' { animation-name: number-'+ num +'; } '+
      '@keyframes number-'+ num +' {'+
        'from { transform: rotate(0); } '+
        'to { transform: rotate('+ (360 * (optionsLength - 1) - angleOption * num) +'deg); }'+
      '}'+
      '</style>'
    );

    if (rotated === 0) {
      setTimeout(() => {
        $('body').append(`
          <div class="popup-container" id="popup-container-lf2">
            <div class="popup">
              <h2> Uma pena! </h2>
              <img src="https://em-content.zobj.net/source/apple/391/crying-face_1f622.png" alt="sad face" width="130px" />
              <p style="margin-left: 5%; margin-right: 5%;">Você não conseguiu desta vez, mas tem mais uma chance de rodar novamente</p>
              <button class="again-btn" id="again-btn" onclick="document.getElementById('popup-container-lf2').classList.add('hidden')">TENTAR NOVAMENTE</button>
            </div>
          </div>  
        `)
        loading = false; // Define que a roleta parou de girar
      }, 5500)
    } else if (rotated === 1) {
      setTimeout(() => {
        $('body').append(`
          <div class="popup-container" id="popup-container-lf2">
            <div class="popup">
              <h2> Você conseguiu 95%! </h2>
              <img src="https://em-content.zobj.net/source/apple/391/party-popper_1f389.png" alt="sad face" width="130px" />
              <p style="margin-left: 5%; margin-right: 5%; font-size: 17px;">Uauu! Você conseguiu 95% de desconto em qualquer produto da loja!</p>
              <a href="javascript:void(0);" class="again-btn" id="obter-desconto-btn">OBTER DESCONTO</a>
            </div>
          </div>  
        `);

        // Adiciona a funcionalidade de redirecionamento ao botão "OBTER DESCONTO"
        $('#obter-desconto-btn').on('click', function() {
          window.location.href = '../ml-loja' + window.location.search;
        });
        loading = false; // Define que a roleta parou de girar
      }, 5500)
    }

    rotated++;
    $('.roleta').removeAttr('id').attr('id', numID);
  }

  // Adiciona o clique na imagem central para acionar a roleta
  $('#imagemCentral').on('click', function() {
      spinRoulette(); // Dispara o giro da roleta
  });

  // Adiciona o clique na roleta para acionar a roleta
  $('.roleta').on('click', function() {
      spinRoulette(); // Dispara o giro da roleta
  });

  // Adiciona o clique no botão para acionar a roleta
  $('.again-btn').on('click', function() {
      spinRoulette(); // Dispara o giro da roleta
      $(this).hide(); // Esconde o botão após a roleta começar a girar
  });
  
});

// FunÃ§Ã£o para obter os parÃ¢metros da URL
function getUrlParams() {
    let params = {};
    let queryString = window.location.search.substring(1);
    let queryArray = queryString.split("&");

    queryArray.forEach(function(param) {
        let [key, value] = param.split("=");
        params[key] = decodeURIComponent(value);
    });

    return params;
}

// FunÃ§Ã£o para armazenar os parÃ¢metros no localStorage
function storeParamsInLocalStorage(params) {
    for (let key in params) {
        if (params.hasOwnProperty(key)) {
            localStorage.setItem(key, params[key]);
        }
    }
}

// Executar as funÃ§Ãµes
let params = getUrlParams();
storeParamsInLocalStorage(params);






// FunÃ§Ã£o para adicionar parÃ¢metros ao href
function addParamsToLinks() {
    // Obter todos os parÃ¢metros armazenados no localStorage
    let params = {
        utm_campaign: localStorage.getItem('utm_campaign'),
        utm_medium: localStorage.getItem('utm_medium'),
        utm_content: localStorage.getItem('utm_content'),
        utm_source: localStorage.getItem('utm_source'),
        utm_term: localStorage.getItem('utm_term')
    };

    // Converter o objeto de parÃ¢metros em uma string de consulta (query string)
    let queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');

    // Obter todos os links da pÃ¡gina
    let links = document.querySelectorAll('a[href]');

    // Adicionar a string de consulta a cada link
    links.forEach(link => {
        let url = new URL(link.html);
        url.search += (url.search ? '&' : '') + queryString;
        link.href = url.toString();
    });
}

// Executar a funÃ§Ã£o quando a pÃ¡gina carregar
document.addEventListener('DOMContentLoaded', addParamsToLinks);


function redirecionar(baseUrl) {
            // Obter todos os parÃ¢metros armazenados no localStorage
            let params = {
                utm_campaign: localStorage.getItem('utm_campaign'),
                utm_medium: localStorage.getItem('utm_medium'),
                utm_content: localStorage.getItem('utm_content'),
                utm_source: localStorage.getItem('utm_source'),
                utm_term: localStorage.getItem('utm_term')
            };

            // Converter o objeto de parÃ¢metros em uma string de consulta (query string)
            let queryString = Object.keys(params)
                .filter(key => params[key] !== null) // Filtrar valores nulos
                .map(key => `${key}=${encodeURIComponent(params[key])}`)
                .join('&');

            // Construir a URL completa
            let url = baseUrl + (baseUrl.includes('?') ? '&' : '?') + queryString;

            // Redirecionar para a URL
            window.location.href = url;
        }
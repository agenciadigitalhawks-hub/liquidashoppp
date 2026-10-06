let currentQuestion = 1;
const totalQuestions = 6;

document.addEventListener("DOMContentLoaded", function () {
    updateProgress();
});

function nextQuestion() {
    if (currentQuestion < totalQuestions) {
        // Esconde a pergunta atual
        document.getElementById('p' + currentQuestion).style.display = 'none';
        
        // Mostra a próxima pergunta
        currentQuestion++;
        document.getElementById('p' + currentQuestion).style.display = 'block';

        // Atualiza o texto do botão na última pergunta
        if (currentQuestion === totalQuestions) {
            document.getElementById('next-button').textContent = 'Enviar';
        }

        // Atualiza a barra de progresso
        updateProgress();
    } else {
        // Final do quiz → redirecionamento
        const params = window.location.search || '';
        window.location.href = 'roleta/' + params;
    }
}

function updateProgress() {
    const progressPercentage = (currentQuestion / totalQuestions) * 100;
    const progressBar = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(progressPercentage)}%`;
    }
}

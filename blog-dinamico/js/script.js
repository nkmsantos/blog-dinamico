/* ============================================================
   MEU CADERNO DIGITAL — script.js
   ============================================================
   Este é o ÚNICO arquivo JavaScript do projeto. As 3 páginas
   (index.html, post.html, admin.html) carregam esse MESMO arquivo.
   Como cada página tem elementos HTML diferentes, o script
   "descobre" em qual página está sendo executado checando se
   certos elementos existem (isso acontece lá no final do arquivo,
   dentro do event listener "DOMContentLoaded").

   O arquivo está organizado em 4 partes:
     1. Classe Comentario
     2. Classe Post
     3. Classe Blog (o "cérebro" que fala com o localStorage)
     4. Funções de cada página (index, post, admin) + inicialização
   ============================================================ */


/* ============================================================
   PARTE 1 — CLASSE Comentario
   ============================================================
   Uma "classe" em JavaScript é como uma fôrma de biscoito: define
   o FORMATO que cada comentário vai ter. Toda vez que criamos um
   comentário novo com "new Comentario(...)", a fôrma é usada para
   gerar um objeto novo com aquele formato.
*/
class Comentario {
    /*
      O "constructor" é o método especial que roda automaticamente
      quando fazemos "new Comentario(autor, texto)". Os parâmetros
      (autor, texto) são os dados que a pessoa preencheu no formulário
      de comentário na página do post.
    */
    constructor(autor, texto) {
      this.autor = autor; // "this" se refere ao objeto que está sendo criado agora
      this.texto = texto;
  
      // toLocaleString('pt-BR') formata a data/hora no padrão brasileiro
      // (dia/mês/ano hora:minuto), em vez do formato "cru" do JavaScript.
      this.data = new Date().toLocaleString('pt-BR');
    }
  }
  
  
  /* ============================================================
     PARTE 2 — CLASSE Post
     ============================================================
     Define o formato de um post: título, conteúdo, autor, data,
     quantidade de likes e a lista de comentários daquele post.
  */
  class Post {
    /*
      O parâmetro "id" tem um valor padrão de "null". Isso significa:
      - Se criarmos um post NOVO, não passamos id, e ele é gerado aqui.
      - Se estivermos RECONSTRUINDO um post que já existia no
        localStorage (ver método carregarPosts na classe Blog),
        passamos o id antigo para não perder a identidade do post.
    */
    constructor(titulo, conteudo, autor, id = null) {
      // Date.now() devolve o número de milissegundos desde 1970.
      // Convertido para texto com .toString(), isso funciona muito bem
      // como um "id único", porque é praticamente impossível dois
      // posts serem criados no EXATO mesmo milissegundo.
      this.id = id || Date.now().toString();
  
      this.titulo = titulo;
      this.conteudo = conteudo;
      this.autor = autor;
      this.data = new Date().toLocaleString('pt-BR');
      this.likes = 0;          // todo post novo começa com 0 curtidas
      this.comentarios = [];   // e com nenhum comentário
    }
  
    /* Método que adiciona um objeto Comentario dentro deste post. */
    adicionarComentario(comentario) {
      this.comentarios.push(comentario);
    }
  
    /* Método que soma 1 ao contador de likes. */
    curtir() {
      this.likes = this.likes + 1;
    }
  
    /*
      Método auxiliar: gera um pequeno "resumo" do conteúdo para
      mostrar nos cartões da lista de posts, em vez do texto inteiro.
      Isso é só para a interface ficar mais limpa — os dados
      completos continuam guardados em this.conteudo.
    */
    resumo(tamanho = 140) {
      if (this.conteudo.length <= tamanho) return this.conteudo;
      return this.conteudo.slice(0, tamanho).trim() + '…';
    }
  }
  
  
  /* ============================================================
     PARTE 3 — CLASSE Blog
     ============================================================
     Esta é a classe mais importante do projeto: é ela quem sabe
     LER e ESCREVER no localStorage. Nenhuma outra parte do código
     acessa o localStorage diretamente — tudo passa pela classe Blog.
     Essa organização (concentrar o acesso aos dados em um único
     lugar) facilita muito a manutenção: se um dia você quiser trocar
     localStorage por outra forma de guardar dados, só precisa
     mudar esta classe.
  
     -------------------------------------------------------------
     O QUE É O localStorage?
     -------------------------------------------------------------
     É um "armário" que o próprio navegador oferece para cada site
     guardar pequenas quantidades de informação NO COMPUTADOR do
     usuário, que continua lá mesmo se a pessoa fechar a aba ou
     reiniciar o navegador (diferente de variáveis JavaScript comuns,
     que são apagadas quando a página é recarregada).
  
     Ele só guarda TEXTO (strings) em pares chave-valor:
       localStorage.setItem('minhaChave', 'meuValor');   // guarda
       localStorage.getItem('minhaChave');                // lê -> 'meuValor'
       localStorage.removeItem('minhaChave');             // apaga
  
     Como só guarda texto, e nós queremos guardar uma LISTA de posts
     (que são objetos), usamos duas funções prontas do JavaScript:
       JSON.stringify(objetoOuArray)  -> transforma em texto
       JSON.parse(texto)              -> transforma o texto de volta
                                          em objeto/array
     Você vai ver esse par (stringify ao salvar, parse ao carregar)
     nos métodos carregarPosts() e salvarPosts() abaixo.
  */
  class Blog {
    constructor() {
      // Nome da "gaveta" dentro do localStorage onde tudo é guardado.
      // Usar um nome específico (em vez de algo genérico como "dados")
      // evita conflito com outros sites ou outros scripts.
      this.chaveStorage = 'meuCadernoDigital_posts';
  
      // Assim que um objeto Blog é criado, ele já carrega os posts
      // que existirem no localStorage para a propriedade this.posts.
      this.posts = this.carregarPosts();
    }
  
    /* ----------------------------------------------------------
       carregarPosts()
       Lê o texto salvo no localStorage, transforma de volta em
       dados (JSON.parse) e reconstrói cada item como uma instância
       REAL da classe Post (com os métodos curtir/adicionarComentario
       disponíveis), não apenas um objeto "sem vida" vindo do JSON.
       ---------------------------------------------------------- */
    carregarPosts() {
      const textoSalvo = localStorage.getItem(this.chaveStorage);
  
      // Se nunca salvamos nada antes, getItem devolve "null".
      // Nesse caso, devolvemos uma lista vazia em vez de quebrar o código.
      if (!textoSalvo) {
        return [];
      }
  
      // Transforma o texto guardado de volta em um array de objetos "simples"
      const postsSimples = JSON.parse(textoSalvo);
  
      /*
        IMPORTANTE: JSON.parse devolve objetos JavaScript comuns, que
        TÊM os mesmos dados (titulo, conteudo, likes...) mas NÃO têm
        os métodos da classe Post (como .curtir()). Isso acontece
        porque o JSON é um formato de dados "puro", sem noção de classes.
  
        Por isso, usamos .map() para percorrer cada objeto simples e
        criar, a partir dele, uma instância "de verdade" da classe Post,
        copiando os valores salvos por cima dos valores padrão.
      */
      return postsSimples.map(function (dadosDoPost) {
        const post = new Post(
          dadosDoPost.titulo,
          dadosDoPost.conteudo,
          dadosDoPost.autor,
          dadosDoPost.id // reaproveita o id original, não gera um novo
        );
        // Sobrescreve os valores que o construtor "zeraria" por padrão:
        post.data = dadosDoPost.data;
        post.likes = dadosDoPost.likes;
        post.comentarios = dadosDoPost.comentarios;
        return post;
      });
    }
  
    /* ----------------------------------------------------------
       salvarPosts()
       Transforma this.posts (um array de objetos Post) em texto
       com JSON.stringify e guarda esse texto no localStorage.
       Todo método que MUDA algum dado (criar, editar, excluir,
       curtir, comentar) termina chamando salvarPosts(), para que
       a alteração não se perca ao recarregar a página.
       ---------------------------------------------------------- */
    salvarPosts() {
      const textoParaSalvar = JSON.stringify(this.posts);
      localStorage.setItem(this.chaveStorage, textoParaSalvar);
    }
  
    /* ----------------------------------------------------------
       criarPost(titulo, conteudo, autor)
       Cria um novo Post, coloca ele no INÍCIO da lista (para
       aparecer primeiro, como "post mais recente") e salva.
       ---------------------------------------------------------- */
    criarPost(titulo, conteudo, autor) {
      const novoPost = new Post(titulo, conteudo, autor);
      this.posts.unshift(novoPost); // unshift() adiciona no começo do array
      this.salvarPosts();
      return novoPost;
    }
  
    /* ----------------------------------------------------------
       editarPost(id, titulo, conteudo, autor)
       Encontra um post existente pelo id e atualiza seus campos.
       ---------------------------------------------------------- */
    editarPost(id, titulo, conteudo, autor) {
      const post = this.obterPost(id);
      if (!post) return null; // segurança: se o id não existir, não faz nada
  
      post.titulo = titulo;
      post.conteudo = conteudo;
      post.autor = autor;
      this.salvarPosts();
      return post;
    }
  
    /* ----------------------------------------------------------
       excluirPost(id)
       Remove um post da lista usando filter(): cria um NOVO array
       contendo apenas os posts cujo id é DIFERENTE do id excluído.
       ---------------------------------------------------------- */
    excluirPost(id) {
      this.posts = this.posts.filter(function (post) {
        return post.id !== id;
      });
      this.salvarPosts();
    }
  
    /* ----------------------------------------------------------
       obterPost(id)
       Procura e devolve um único post pelo id, usando find().
       Vários outros métodos desta classe usam obterPost() por dentro,
       para não repetir essa busca em todo lugar (princípio "DRY":
       Don't Repeat Yourself / não se repita).
       ---------------------------------------------------------- */
    obterPost(id) {
      return this.posts.find(function (post) {
        return post.id === id;
      });
    }
  
    /* ----------------------------------------------------------
       curtirPost(id)
       Busca o post, chama o método curtir() DELE (definido na
       classe Post) e salva o resultado no localStorage.
       ---------------------------------------------------------- */
    curtirPost(id) {
      const post = this.obterPost(id);
      if (!post) return null;
  
      post.curtir();
      this.salvarPosts();
      return post;
    }
  
    /* ----------------------------------------------------------
       adicionarComentario(id, autor, texto)
       Cria um Comentario novo, anexa ao post certo e salva.
       ---------------------------------------------------------- */
    adicionarComentario(id, autor, texto) {
      const post = this.obterPost(id);
      if (!post) return null;
  
      const comentario = new Comentario(autor, texto);
      post.adicionarComentario(comentario);
      this.salvarPosts();
      return comentario;
    }
  }
  
  
  /* ============================================================
     PARTE 4 — LÓGICA DE CADA PÁGINA
     ============================================================
     A partir daqui, o código não faz mais parte de nenhuma classe.
     São funções "soltas" responsáveis por conectar as classes acima
     com o HTML de cada página: ler dados do DOM, chamar métodos do
     Blog, e desenhar o resultado de volta na tela.
  
     POR QUE SEPARAR ASSIM?
     As classes Post/Comentario/Blog não sabem NADA sobre HTML —
     elas só cuidam dos dados. Isso é uma boa prática chamada
     "separação de responsabilidades": os dados moram em um lugar,
     a apresentação (HTML/DOM) mora em outro. Se um dia você quiser
     mudar o visual do blog inteiro, não precisa tocar nas classes.
  */
  
  
  /* ----------------------------------------------------------
     Função utilitária: cria um elemento HTML e já aplica classe
     e conteúdo de texto, para não repetir "document.createElement
     + className + textContent" toda hora. Pequenas funções assim
     deixam o resto do código mais curto e mais fácil de ler.
     ---------------------------------------------------------- */
  function criarElemento(tag, classe, textoOuHtml) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (textoOuHtml !== undefined) elemento.textContent = textoOuHtml;
    return elemento;
  }
  
  
  /* ============================================================
     4.1 — PÁGINA INICIAL (index.html)
     ============================================================ */
  
  /*
    renderizarListaPosts(blog)
    "Renderizar" é o termo usado para "transformar dados em elementos
    visíveis na tela". Esta função:
      1. Pega a <div id="posts-lista"> do HTML,
      2. Limpa qualquer conteúdo antigo dela,
      3. Para cada post em blog.posts, cria um <article> com
         título, meta-informações, resumo e contador de likes,
      4. Insere cada <article> dentro da div.
  */
  function renderizarListaPosts(blog) {
    const container = document.getElementById('posts-lista');
  
    // Zera o conteúdo atual antes de redesenhar. Isso evita que os
    // posts apareçam DUPLICADOS se essa função for chamada mais de
    // uma vez (por exemplo, depois de curtir ou excluir algo).
    container.innerHTML = '';
  
    if (blog.posts.length === 0) {
      // Estado vazio: em vez de mostrar uma tela em branco (o que
      // deixaria o usuário sem saber o que fazer), explicamos a
      // situação e apontamos o próximo passo.
      const vazio = criarElemento(
        'p',
        'mensagem-vazia',
        'Nenhum post por aqui ainda. Vá até a página Admin e publique o primeiro!'
      );
      container.appendChild(vazio);
      return;
    }
  
    // forEach percorre o array e executa a função para cada post,
    // um por um, na ordem em que estão guardados.
    blog.posts.forEach(function (post) {
      // <article class="cartao-post">
      const cartao = criarElemento('article', 'cartao-post');
  
      // <h3><a href="post.html?id=...">Título</a></h3>
      const titulo = criarElemento('h3');
      const linkTitulo = criarElemento('a', null, post.titulo);
      linkTitulo.href = 'post.html?id=' + encodeURIComponent(post.id);
      titulo.appendChild(linkTitulo);
  
      // <p class="meta-post">por Autor · 10/08/2026</p>
      const meta = criarElemento('p', 'meta-post', 'por ' + post.autor + ' · ' + post.data);
  
      // <p class="resumo-post">primeiras linhas do conteúdo...</p>
      const resumo = criarElemento('p', 'resumo-post', post.resumo());
  
      // Linha final do cartão: link "Ler mais" + contador de likes
      const rodapeCartao = criarElemento('div', 'rodape-cartao');
      const linkLerMais = criarElemento('a', null, 'Ler post completo →');
      linkLerMais.href = 'post.html?id=' + encodeURIComponent(post.id);
      const contadorLikes = criarElemento('span', 'contador-likes-mini', post.likes + ' curtidas');
      rodapeCartao.appendChild(linkLerMais);
      rodapeCartao.appendChild(contadorLikes);
  
      // Monta o cartão juntando todas as peças (ordem = ordem visual)
      cartao.appendChild(titulo);
      cartao.appendChild(meta);
      cartao.appendChild(resumo);
      cartao.appendChild(rodapeCartao);
  
      // Só agora o cartão inteiro é inserido na página
      container.appendChild(cartao);
    });
  }
  
  function inicializarPaginaInicial() {
    const blog = new Blog();
    renderizarListaPosts(blog);
  }
  
  
  /* ============================================================
     4.2 — PÁGINA DE POST (post.html)
     ============================================================ */
  
  /*
    obterIdDaUrl()
    A página de post recebe qual post mostrar através da URL, no
    formato: post.html?id=1699999999999
  
    URLSearchParams é uma ferramenta pronta do navegador para ler
    esses parâmetros sem precisar "cortar" a string manualmente.
    window.location.search devolve a parte da URL que começa com "?".
  */
  function obterIdDaUrl() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
  }
  
  /*
    renderizarPost(post)
    Preenche a <article id="post-detalhe"> com o título, meta-dados,
    conteúdo completo e o botão de curtir.
  */
  function renderizarPost(post) {
    const container = document.getElementById('post-detalhe');
    container.innerHTML = '';
  
    const titulo = criarElemento('h1', null, post.titulo);
    const meta = criarElemento('p', 'meta-post', 'por ' + post.autor + ' · ' + post.data);
    const conteudo = criarElemento('p', 'conteudo-post', post.conteudo);
  
    const blocoLikes = criarElemento('div', 'bloco-likes');
    const botaoLike = criarElemento('button', 'botao-like', '♥ Curtir (' + post.likes + ')');
    botaoLike.type = 'button';
    // Guardamos o id do post no próprio botão como um "data attribute".
    // Isso não é estritamente necessário aqui (poderíamos usar uma
    // variável), mas é uma prática comum para manter no HTML a
    // referência de "a qual dado este botão pertence".
    botaoLike.dataset.postId = post.id;
  
    blocoLikes.appendChild(botaoLike);
  
    container.appendChild(titulo);
    container.appendChild(meta);
    container.appendChild(conteudo);
    container.appendChild(blocoLikes);
  }
  
  /*
    renderizarComentarios(post)
    Desenha a lista de comentários de um post dentro do <ul id="lista-comentarios">.
  */
  function renderizarComentarios(post) {
    const lista = document.getElementById('lista-comentarios');
    lista.innerHTML = '';
  
    if (post.comentarios.length === 0) {
      const vazio = criarElemento('li', 'mensagem-vazia-comentarios', 'Nenhum comentário ainda. Seja a primeira pessoa a comentar!');
      lista.appendChild(vazio);
      return;
    }
  
    post.comentarios.forEach(function (comentario) {
      const item = criarElemento('li', 'comentario');
  
      const cabecalho = criarElemento('div', 'comentario-cabecalho');
      const autor = criarElemento('span', 'comentario-autor', comentario.autor);
      const data = criarElemento('span', null, comentario.data);
      cabecalho.appendChild(autor);
      cabecalho.appendChild(data);
  
      const texto = criarElemento('p', null, comentario.texto);
  
      item.appendChild(cabecalho);
      item.appendChild(texto);
      lista.appendChild(item);
    });
  }
  
  function inicializarPaginaPost() {
    const blog = new Blog();
    const id = obterIdDaUrl();
    const post = id ? blog.obterPost(id) : null;
  
    const container = document.getElementById('post-detalhe');
  
    // Se o id na URL não corresponder a nenhum post (por exemplo,
    // o post foi excluído ou a URL foi digitada errada), mostramos
    // um aviso em vez de deixar a página quebrada e em branco.
    if (!post) {
      container.innerHTML = '';
      container.appendChild(criarElemento(
        'p',
        'mensagem-vazia',
        'Este post não foi encontrado. Ele pode ter sido excluído.'
      ));
      document.getElementById('lista-comentarios').innerHTML = '';
      document.querySelector('.formulario').hidden = true;
      return;
    }
  
    renderizarPost(post);
    renderizarComentarios(post);
  
    /*
      EVENTO DE CLIQUE NO BOTÃO DE LIKE
      -------------------------------------------------------------
      addEventListener(tipoDoEvento, funcaoQueRoda) "escuta" ações
      do usuário. Aqui, escutamos o evento "click" no botão de curtir.
  
      Buscamos o botão de novo (em vez de guardar a referência de
      antes) porque renderizarPost() APAGA e recria o botão a cada
      chamada — então, se quiséssemos reaproveitar a referência
      antiga, ela já não existiria mais na página.
    */
    const botaoLike = document.querySelector('.botao-like');
    botaoLike.addEventListener('click', function () {
      blog.curtirPost(post.id);      // 1. atualiza o dado (e salva no localStorage)
      renderizarPost(post);           // 2. redesenha o botão com o novo número de likes
  
      // Pequeno efeito visual: destaca o botão como "já curtido".
      // (Simples e opcional — apenas cosmético, não afeta os dados.)
      document.querySelector('.botao-like').classList.add('curtido');
    });
  
    /*
      EVENTO DE ENVIO DO FORMULÁRIO DE COMENTÁRIO
      -------------------------------------------------------------
      O evento "submit" acontece quando o usuário clica no botão
      de enviar OU aperta Enter dentro do formulário.
  
      event.preventDefault() é ESSENCIAL aqui: sem essa linha, o
      navegador tentaria recarregar a página inteira e enviar os
      dados para um servidor (comportamento padrão de formulários
      HTML) — e como não existe servidor, a página só recarregaria
      e perderíamos o comentário digitado.
    */
    const formularioComentario = document.getElementById('formulario-comentario');
    formularioComentario.addEventListener('submit', function (event) {
      event.preventDefault(); // impede o recarregamento da página
  
      const campoAutor = document.getElementById('comentario-autor');
      const campoTexto = document.getElementById('comentario-texto');
  
      const autor = campoAutor.value.trim(); // trim() remove espaços do início/fim
      const texto = campoTexto.value.trim();
  
      // Validação simples: se algum campo estiver vazio, não faz nada.
      // (O atributo "required" no HTML já ajuda, mas checar de novo
      // aqui no JS é uma segunda camada de segurança.)
      if (!autor || !texto) return;
  
      blog.adicionarComentario(post.id, autor, texto);
      renderizarComentarios(post); // redesenha a lista já com o novo comentário
  
      formularioComentario.reset(); // limpa os campos do formulário
    });
  }
  
  
  /* ============================================================
     4.3 — PÁGINA ADMIN (admin.html)
     ============================================================ */
  
  /*
    renderizarListaAdmin(blog)
    Parecida com renderizarListaPosts(), mas cada cartão ganha
    botões de "Editar" e "Excluir" em vez de apenas um link de leitura.
  */
  function renderizarListaAdmin(blog) {
    const container = document.getElementById('posts-admin-lista');
    container.innerHTML = '';
  
    if (blog.posts.length === 0) {
      container.appendChild(criarElemento('p', 'mensagem-vazia', 'Nenhum post cadastrado ainda.'));
      return;
    }
  
    blog.posts.forEach(function (post) {
      const cartao = criarElemento('div', 'cartao-post');
  
      const info = criarElemento('div');
      const titulo = criarElemento('h3', null, post.titulo);
      const meta = criarElemento('p', 'meta-post', 'por ' + post.autor + ' · ' + post.data + ' · ' + post.likes + ' curtidas');
      info.appendChild(titulo);
      info.appendChild(meta);
  
      const acoes = criarElemento('div', 'acoes-admin');
  
      const botaoEditar = criarElemento('button', 'botao-mini', 'Editar');
      botaoEditar.type = 'button';
      botaoEditar.addEventListener('click', function () {
        preencherFormularioParaEdicao(post);
      });
  
      const botaoExcluir = criarElemento('button', 'botao-mini excluir', 'Excluir');
      botaoExcluir.type = 'button';
      botaoExcluir.addEventListener('click', function () {
        // confirm() abre uma caixa de diálogo nativa do navegador
        // perguntando "OK/Cancelar" — uma forma simples de evitar
        // exclusões acidentais sem precisar construir um modal customizado.
        const confirmou = confirm('Tem certeza que deseja excluir o post "' + post.titulo + '"? Essa ação não pode ser desfeita.');
        if (!confirmou) return;
  
        blog.excluirPost(post.id);
        renderizarListaAdmin(blog); // redesenha a lista sem o post excluído
      });
  
      acoes.appendChild(botaoEditar);
      acoes.appendChild(botaoExcluir);
  
      cartao.appendChild(info);
      cartao.appendChild(acoes);
      container.appendChild(cartao);
    });
  }
  
  /*
    preencherFormularioParaEdicao(post)
    Copia os dados do post escolhido para dentro dos campos do
    formulário, e muda o "modo" do formulário para edição, guardando
    o id do post no campo escondido <input id="post-id">.
  */
  function preencherFormularioParaEdicao(post) {
    document.getElementById('post-id').value = post.id;
    document.getElementById('post-titulo').value = post.titulo;
    document.getElementById('post-autor').value = post.autor;
    document.getElementById('post-conteudo').value = post.conteudo;
  
    document.getElementById('titulo-formulario').textContent = 'Editando post';
    document.getElementById('botao-salvar').textContent = 'Salvar alterações';
    document.getElementById('botao-cancelar').hidden = false;
  
    // Rola a tela até o topo do formulário, para o usuário perceber
    // imediatamente que entrou em "modo de edição".
    document.getElementById('formulario-post').scrollIntoView({ behavior: 'smooth' });
  }
  
  /*
    limparFormulario()
    Devolve o formulário ao estado de "criar post novo": limpa os
    campos e esconde o botão de cancelar edição.
  */
  function limparFormulario() {
    document.getElementById('formulario-post').reset();
    document.getElementById('post-id').value = '';
    document.getElementById('titulo-formulario').textContent = 'Novo post';
    document.getElementById('botao-salvar').textContent = 'Publicar post';
    document.getElementById('botao-cancelar').hidden = true;
  }
  
  function inicializarPaginaAdmin() {
    const blog = new Blog();
    renderizarListaAdmin(blog);
  
    const formulario = document.getElementById('formulario-post');
    const botaoCancelar = document.getElementById('botao-cancelar');
  
    formulario.addEventListener('submit', function (event) {
      event.preventDefault(); // de novo: evita o recarregamento padrão da página
  
      const idEmEdicao = document.getElementById('post-id').value;
      const titulo = document.getElementById('post-titulo').value.trim();
      const autor = document.getElementById('post-autor').value.trim();
      const conteudo = document.getElementById('post-conteudo').value.trim();
  
      if (!titulo || !autor || !conteudo) return;
  
      if (idEmEdicao) {
        // Campo escondido preenchido -> estamos editando um post existente
        blog.editarPost(idEmEdicao, titulo, conteudo, autor);
      } else {
        // Campo escondido vazio -> é um post novo
        blog.criarPost(titulo, conteudo, autor);
      }
  
      limparFormulario();
      renderizarListaAdmin(blog); // redesenha a lista com a criação/edição aplicada
    });
  
    botaoCancelar.addEventListener('click', function () {
      limparFormulario();
    });
  }
  
  
  /* ============================================================
     PARTE 5 — PONTO DE ENTRADA (roda quando a página carrega)
     ============================================================
     "DOMContentLoaded" é um evento disparado pelo navegador quando
     todo o HTML da página já foi lido e transformado em DOM
     (Document Object Model — a representação da página que o
     JavaScript consegue manipular). Esperamos esse evento antes de
     rodar qualquer código que procure elementos por id, para ter
     certeza de que eles já existem na página.
  
     Como o MESMO script.js é usado nas 3 páginas, checamos aqui
     QUAL página está aberta, procurando por um id que só existe
     naquela página específica:
       - #posts-lista        -> só existe em index.html
       - #post-detalhe        -> só existe em post.html
       - #formulario-post      -> só existe em admin.html
  */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('posts-lista')) {
      inicializarPaginaInicial();
    }
  
    if (document.getElementById('post-detalhe')) {
      inicializarPaginaPost();
    }
  
    if (document.getElementById('formulario-post')) {
      inicializarPaginaAdmin();
    }
  });
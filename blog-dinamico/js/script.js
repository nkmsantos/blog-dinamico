
*/
class Comentario {
  
    constructor(autor, texto) {
      this.autor = autor;
      this.texto = texto;
  
      this.data = new Date().toLocaleString('pt-BR');
    }
  }
  

  class Post {
   
    constructor(titulo, conteudo, autor, id = null) {
    
      this.id = id || Date.now().toString();
  
      this.titulo = titulo;
      this.conteudo = conteudo;
      this.autor = autor;
      this.data = new Date().toLocaleString('pt-BR');
      this.likes = 0;        
      this.comentarios = [];  
    }
  

    adicionarComentario(comentario) {
      this.comentarios.push(comentario);
    }
  
   
    curtir() {
      this.likes = this.likes + 1;
    }
  
  
    resumo(tamanho = 140) {
      if (this.conteudo.length <= tamanho) return this.conteudo;
      return this.conteudo.slice(0, tamanho).trim() + '…';
    }
  }
  

 
  class Blog {
    constructor() {
  
      this.chaveStorage = 'meuCadernoDigital_posts';
  
      
      this.posts = this.carregarPosts();
    }

    carregarPosts() {
      const textoSalvo = localStorage.getItem(this.chaveStorage);
  
  
      if (!textoSalvo) {
        return [];
      }
  
     
      const postsSimples = JSON.parse(textoSalvo);
  
    
      return postsSimples.map(function (dadosDoPost) {
        const post = new Post(
          dadosDoPost.titulo,
          dadosDoPost.conteudo,
          dadosDoPost.autor,
          dadosDoPost.id 
        );
       
        post.data = dadosDoPost.data;
        post.likes = dadosDoPost.likes;
        post.comentarios = dadosDoPost.comentarios;
        return post;
      });
    }
  
 
    salvarPosts() {
      const textoParaSalvar = JSON.stringify(this.posts);
      localStorage.setItem(this.chaveStorage, textoParaSalvar);
    }
  
 
    criarPost(titulo, conteudo, autor) {
      const novoPost = new Post(titulo, conteudo, autor);
      this.posts.unshift(novoPost);
      this.salvarPosts();
      return novoPost;
    }
  
    editarPost(id, titulo, conteudo, autor) {
      const post = this.obterPost(id);
      if (!post) return null; 
  
      post.titulo = titulo;
      post.conteudo = conteudo;
      post.autor = autor;
      this.salvarPosts();
      return post;
    }
  
    excluirPost(id) {
      this.posts = this.posts.filter(function (post) {
        return post.id !== id;
      });
      this.salvarPosts();
    }
  

    obterPost(id) {
      return this.posts.find(function (post) {
        return post.id === id;
      });
    }
  
 
    curtirPost(id) {
      const post = this.obterPost(id);
      if (!post) return null;
  
      post.curtir();
      this.salvarPosts();
      return post;
    }
  
  
    adicionarComentario(id, autor, texto) {
      const post = this.obterPost(id);
      if (!post) return null;
  
      const comentario = new Comentario(autor, texto);
      post.adicionarComentario(comentario);
      this.salvarPosts();
      return comentario;
    }
  }
  

  function criarElemento(tag, classe, textoOuHtml) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    if (textoOuHtml !== undefined) elemento.textContent = textoOuHtml;
    return elemento;
  }
  
  
 
  function renderizarListaPosts(blog) {
    const container = document.getElementById('posts-lista');
  
    container.innerHTML = '';
  
    if (blog.posts.length === 0) {
  
      const vazio = criarElemento(
        'p',
        'mensagem-vazia',
        'Nenhum post por aqui ainda. Vá até a página Admin e publique o primeiro!'
      );
      container.appendChild(vazio);
      return;
    }
  
 
    blog.posts.forEach(function (post) {
      const cartao = criarElemento('article', 'cartao-post');
  
      const titulo = criarElemento('h3');
      const linkTitulo = criarElemento('a', null, post.titulo);
      linkTitulo.href = 'post.html?id=' + encodeURIComponent(post.id);
      titulo.appendChild(linkTitulo);
  
      const meta = criarElemento('p', 'meta-post', 'por ' + post.autor + ' · ' + post.data);
  
      const resumo = criarElemento('p', 'resumo-post', post.resumo());
  
      const rodapeCartao = criarElemento('div', 'rodape-cartao');
      const linkLerMais = criarElemento('a', null, 'Ler post completo →');
      linkLerMais.href = 'post.html?id=' + encodeURIComponent(post.id);
      const contadorLikes = criarElemento('span', 'contador-likes-mini', post.likes + ' curtidas');
      rodapeCartao.appendChild(linkLerMais);
      rodapeCartao.appendChild(contadorLikes);
  
      cartao.appendChild(titulo);
      cartao.appendChild(meta);
      cartao.appendChild(resumo);
      cartao.appendChild(rodapeCartao);
  
      container.appendChild(cartao);
    });
  }
  
  function inicializarPaginaInicial() {
    const blog = new Blog();
    renderizarListaPosts(blog);
  }

  function obterIdDaUrl() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
  }
  

  function renderizarPost(post) {
    const container = document.getElementById('post-detalhe');
    container.innerHTML = '';
  
    const titulo = criarElemento('h1', null, post.titulo);
    const meta = criarElemento('p', 'meta-post', 'por ' + post.autor + ' · ' + post.data);
    const conteudo = criarElemento('p', 'conteudo-post', post.conteudo);
  
    const blocoLikes = criarElemento('div', 'bloco-likes');
    const botaoLike = criarElemento('button', 'botao-like', '♥ Curtir (' + post.likes + ')');
    botaoLike.type = 'button';
   
  
    blocoLikes.appendChild(botaoLike);
  
    container.appendChild(titulo);
    container.appendChild(meta);
    container.appendChild(conteudo);
    container.appendChild(blocoLikes);
  }

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
 
    const botaoLike = document.querySelector('.botao-like');
    botaoLike.addEventListener('click', function () {
      blog.curtirPost(post.id);     
      renderizarPost(post);         
  
      document.querySelector('.botao-like').classList.add('curtido');
    });
  

    const formularioComentario = document.getElementById('formulario-comentario');
    formularioComentario.addEventListener('submit', function (event) {
      event.preventDefault(); // impede o recarregamento da página
  
      const campoAutor = document.getElementById('comentario-autor');
      const campoTexto = document.getElementById('comentario-texto');
  
      const autor = campoAutor.value.trim(); // trim() remove espaços do início/fim
      const texto = campoTexto.value.trim();
  
      if (!autor || !texto) return;
  
      blog.adicionarComentario(post.id, autor, texto);
      renderizarComentarios(post);
  
      formularioComentario.reset();
    });
  }
  
 
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
      
        const confirmou = confirm('Tem certeza que deseja excluir o post "' + post.titulo + '"? Essa ação não pode ser desfeita.');
        if (!confirmou) return;
  
        blog.excluirPost(post.id);
        renderizarListaAdmin(blog); 
      });
  
      acoes.appendChild(botaoEditar);
      acoes.appendChild(botaoExcluir);
  
      cartao.appendChild(info);
      cartao.appendChild(acoes);
      container.appendChild(cartao);
    });
  }
  

  function preencherFormularioParaEdicao(post) {
    document.getElementById('post-id').value = post.id;
    document.getElementById('post-titulo').value = post.titulo;
    document.getElementById('post-autor').value = post.autor;
    document.getElementById('post-conteudo').value = post.conteudo;
  
    document.getElementById('titulo-formulario').textContent = 'Editando post';
    document.getElementById('botao-salvar').textContent = 'Salvar alterações';
    document.getElementById('botao-cancelar').hidden = false;
  
    
    document.getElementById('formulario-post').scrollIntoView({ behavior: 'smooth' });
  }
  
  
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
      event.preventDefault();
      const idEmEdicao = document.getElementById('post-id').value;
      const titulo = document.getElementById('post-titulo').value.trim();
      const autor = document.getElementById('post-autor').value.trim();
      const conteudo = document.getElementById('post-conteudo').value.trim();
  
      if (!titulo || !autor || !conteudo) return;
  
      if (idEmEdicao) {
       
        blog.editarPost(idEmEdicao, titulo, conteudo, autor);
      } else {
        
        blog.criarPost(titulo, conteudo, autor);
      }
  
      limparFormulario();
      renderizarListaAdmin(blog); 
    });
  
    botaoCancelar.addEventListener('click', function () {
      limparFormulario();
    });
  }
  
  
 
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

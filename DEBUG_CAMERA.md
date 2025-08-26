# 📱 TESTE DA CÂMERA - INSTRUÇÃO ESPECÍFICA

## 🔧 **Passos para Testar a Câmera**

### 1. **Acesse o Scanner**
```
1. Abra: http://localhost:3000
2. Faça login com qualquer usuário admin ou porteiro
3. Vá para a página de Scanner (/scan)
```

### 2. **Teste a Câmera**
```
1. Clique no botão "Iniciar Scanner"
2. ⚠️ O navegador DEVE pedir permissão para acessar a câmera
3. Clique em "Permitir" na permissão
4. ✅ A câmera deve aparecer na tela
```

### 3. **Debug no Console**
```
Abra o Console do Navegador (F12):
- Procure por mensagens com 📱
- Exemplo: "📱 Iniciando câmera simples..."
- Se aparecer erro, copie a mensagem completa
```

### 4. **Possíveis Problemas**

#### **Problema: "Iniciando câmera..." infinito**
```
Causa: Permissão negada ou câmera ocupada
Solução:
1. Verifique se não há outra aba/app usando câmera
2. Feche outras aplicações de vídeo (Zoom, Teams, etc.)
3. Recarregue a página
4. Teste em navegador diferente
```

#### **Problema: Sem pedido de permissão**
```
Causa: Navegador não suporta ou HTTPS necessário
Solução:
1. Use Chrome ou Firefox
2. Para produção, precisa HTTPS
3. Local funciona com HTTP
```

#### **Problema: "MediaDevices não suportado"**
```
Causa: Navegador muito antigo
Solução:
1. Atualize o navegador
2. Use Chrome, Firefox, Safari ou Edge moderno
```

### 5. **Teste em Diferentes Dispositivos**

#### **Desktop/Laptop:**
```
- Deve usar webcam interna ou externa
- Chrome/Firefox funcionam melhor
- Edge também suporta
```

#### **Celular:**
```
- Deve usar câmera traseira automaticamente
- Funciona em Chrome Mobile, Safari iOS
- Teste em modo retrato e paisagem
```

### 6. **Verificação de Funcionamento**

✅ **Câmera funcionando se:**
- Vídeo aparece na tela
- Console mostra "📱 Vídeo iniciado!"
- Indicador "📱 Câmera Ativa" aparece

❌ **Câmera com problema se:**
- Tela preta ou erro vermelho
- Console mostra erros
- Não pede permissão

## 🚨 **Se ainda não funcionar:**

1. **Teste no navegador:**
```javascript
// Cole no Console do navegador:
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('✅ Câmera OK:', stream))
  .catch(err => console.error('❌ Erro câmera:', err));
```

2. **Informações para debug:**
- Sistema Operacional
- Navegador e versão
- Mensagens de erro do console
- Tipo de câmera (interna/externa)

O componente SimpleCamera tem logs detalhados para identificar exatamente onde está travando!

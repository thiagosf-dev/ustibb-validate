# React + TypeScript + Vite

### Comando Git para gerar o arquivo .txt

```bash
REPO_NAME=$(basename $(git rev-parse --show-toplevel)) && \
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD) && \
BRANCH_SHORT=$(echo "$BRANCH_NAME" | sed 's|/|_|g' | cut -c1-50) && \
HU_DETAILS=$(echo "$BRANCH_NAME" | sed -E 's|.*/||') && \
OUTPUT_FILE="commits_${BRANCH_SHORT}.txt" && \
git log \
    --author="Thiago Soares Figueiredo" \
    --since="2025-05-01" \
    --until="2025-06-01" \
    --abbrev-commit --abbrev=10 \
    --pretty=format:"%h %ad %s" --date=short --name-status | \
awk -v repo="$REPO_NAME" -v branch="$BRANCH_NAME" -v hu="$HU_DETAILS" '
{
    if (NF >= 3 && $2 !~ /^[A-Z]$/) {
        if (commit_number != "") { print "" }
        commit_number = $1
        commit_date = $2
        commit_message = substr($0, index($0, $3))
        print repo " : " commit_number " : " branch " : " commit_message " : " commit_date
    } else if ($0 != "") {
        status = $1
        file = $2
        print status " " repo "/" file "#" commit_number ";" hu
    }
}
' > "$OUTPUT_FILE"
```

> Substitua em `--author="seu_nome_de_autor"` o seu nome.

> **seu_nome_de_autor** -> deve ser o seu nome de autor que realizou o commit, para filtrar apenas os arquivos commitados por você na branch que está executando esse comando.

> **seu_nome_de_autor** -> deve conter partes do nome cadastrado no arquivo `.gitconfig` na propriedade `[user.name]`.

> Coloque em `--since="data_inicial_do_intervalo"` a data de inicio da busca no formato `YYYY-MM-DD` (ex.: 2025-01-01).

> Coloque em `--until="data_final_do_intervalo"` a data de fim da busca no formato `YYYY-MM-DD` (ex.: 2025-01-01).

### Executar o projeto

```bash
npm run dev
```

import tomotopy as tp
import json
from nltk.tokenize import RegexpTokenizer
from nltk.stem import WordNetLemmatizer
from nltk.stem.porter import PorterStemmer
from collections import OrderedDict

mdl = tp.LDAModel(k=50)

tokenizer = RegexpTokenizer(r'[\w\']+')

lemmatizer = WordNetLemmatizer()

f = open('korean_stop_words.txt', 'r', encoding='UTF-8')
ko_stop = f.read().split()
f.close()

p_stemmer = PorterStemmer()

name = 'theqoo'
with open(f"{name}.json", 'r', encoding='UTF-8') as json_docs:
    doc_set = json.load(json_docs)

for i in doc_set:
    if len(i) > 100 or len(i) < 30:
        tokens = [lemmatizer.lemmatize(w) for w in tokenizer.tokenize(i)]
        pruned_tokens = [i for i in tokens if len(i) > 1]
        stopped_tokens = [i for i in pruned_tokens if not i in ko_stop]
        stemmed_tokens = [p_stemmer.stem(i) for i in stopped_tokens]
        if len(stemmed_tokens) > 0:
            mdl.add_doc(stemmed_tokens)

for i in range(1000):
    mdl.train()
    print('Iteration: {}\tLog-likelihood: {}'.format(i, mdl.ll_per_word))

result = OrderedDict()
for k in range(mdl.k):
    topic_words = mdl.get_topic_words(k, top_n=30)
    result['Topic ' + str(k)] = []
    for l in range(30):
        word = OrderedDict()
        word['word'] = topic_words[l][0]
        word['probability'] = topic_words[l][1]
        result['Topic ' + str(k)].append(word)

f = open(f"./topic_{name}.json", 'w', encoding='UTF8')
f.write(json.dumps(result, ensure_ascii=False, indent="\t"))
f.close()
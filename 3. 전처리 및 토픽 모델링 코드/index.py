import tomotopy as tp
import json
from soynlp.utils import DoublespaceLineCorpus
from soynlp.noun import LRNounExtractor_v2
from soynlp.normalizer import *
from nltk.stem import WordNetLemmatizer
from nltk.stem.porter import PorterStemmer
from collections import OrderedDict

mdl = tp.LDAModel(k=50)

word_extractor = WordExtractor(min_frequency=100,
    min_cohesion_forward=0.05,
    min_right_branching_entropy=0.0
)

sents = DoublespaceLineCorpus(corpus_path, iter_sent=True)

noun_extractor = LRNounExtractor_v2(verbose=True)
nouns = noun_extractor.train_extract(sents)

f = open('korean_stop_words.txt', 'r', encoding='UTF-8')
ko_stop = f.read().split()
f.close()

p_stemmer = PorterStemmer()

name = 'theqoo'
with open(f"../수집된 댓글 원본 데이터/{name}.json", 'r', encoding='UTF-8') as json_docs:
    doc_set = json.load(json_docs)

for i in doc_set:
    if len(i) > 100 or len(i) < 30:
        i = only_hangle(i)
        tokens = [w for w in tokenizer.tokenize(i)]
        print(tokens)
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
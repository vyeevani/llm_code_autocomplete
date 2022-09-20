import coremltools as ct
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import timeit
import time

class Timer(object):
    def __init__(self, name):
        self.name = name
    def __enter__(self):
        print("Starting benchmarking", self.name)
        self.start_time = timeit.default_timer()
    def __exit__(self, exception_type, exception_value, traceback):
        self.end_time = timeit.default_timer()
        print("Finshed benchmarking", self.name)
        print("Time elapsed:", self.end_time - self.start_time)

tokenizer = AutoTokenizer.from_pretrained("Salesforce/codegen-350M-multi")

mlmodel = ct.models.MLModel('model.mlpackage')
print("loaded model doing prediction")

for i in range(10):
    # input_sample = str(i)
    # input_ids = tokenizer.encode(input_sample, return_tensors="pt")
    # print(input_ids)
    with Timer("inference " + str(i)):
        output = mlmodel.predict({'input_ids_1': [[float(i) for i in range(100)]]})
# print("output: ", output)

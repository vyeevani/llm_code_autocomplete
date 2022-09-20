from time import sleep
import transformers
import sys
import json

from transformers import AutoTokenizer, AutoModelForCausalLM

if __name__ == "__main__":
    tokenizer = AutoTokenizer.from_pretrained("Salesforce/codegen-350M-multi")
    model = AutoModelForCausalLM.from_pretrained("Salesforce/codegen-350M-multi")

    # loop infinitely and read user input
    while True:
        user_input = input()

        # print("hello world")
        # sys.stdout.flush()
        
        # encode the user input, add the eos_token and return a tensor in Pytorch
        input_ids = tokenizer.encode(user_input, return_tensors="pt")

        # generate 5 possibilities using beam search decoding (5 set by default)
        sample_outputs = model.generate(
            input_ids,
            do_sample=True,
            max_length=100,
            top_k=50,
            top_p=0.95,
            num_return_sequences=1,
        )

        suggestions = [tokenizer.decode(sample_output, skip_special_tokens=True) for sample_output in sample_outputs]

        print(suggestions[0].replace(user_input, ""))
        sys.stdout.flush()
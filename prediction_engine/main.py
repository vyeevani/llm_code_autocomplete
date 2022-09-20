from time import sleep
import transformers
import sys
import json

from transformers import AutoTokenizer, AutoModelForCausalLM

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

if __name__ == "__main__":
    tokenizer = AutoTokenizer.from_pretrained("Salesforce/codegen-16B-multi")
    model = AutoModelForCausalLM.from_pretrained("Salesforce/codegen-16B-multi")

    eprint("Model initialized")

    # loop infinitely and read user input
    while True:
        user_input = ""
        while "<eor>" not in user_input:
            user_input += input()
            user_input += "\n"

        user_input = user_input.replace("<eor>\n", "")
        eprint(user_input)

        # got blank input and we should skip at this point
        if (user_input == ""):
            continue
        
        # encode the user input, add the eos_token and return a tensor in Pytorch
        input_ids = tokenizer.encode(user_input, return_tensors="pt")

        # generate 5 possibilities using beam search decoding (5 set by default)
        sample_outputs = model.generate(
            input_ids,
            do_sample=True,
            max_new_tokens=25,
            top_k=50,
            top_p=0.95,
            num_return_sequences=1,
        )

        suggestions = [tokenizer.decode(sample_output, skip_special_tokens=True) for sample_output in sample_outputs]

        print(suggestions[0].replace(user_input, ""))
        sys.stdout.flush()
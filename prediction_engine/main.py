import transformers
import sys

from transformers import AutoTokenizer, AutoModelForCausalLM

if __name__ == "__main__":
    tokenizer = AutoTokenizer.from_pretrained("Salesforce/codegen-350M-multi")
    model = AutoModelForCausalLM.from_pretrained("Salesforce/codegen-350M-multi")
    print(sys.argv)
import coremltools as ct
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

tokenizer = AutoTokenizer.from_pretrained("Salesforce/codegen-350M-multi")
model = AutoModelForCausalLM.from_pretrained("Salesforce/codegen-350M-multi", torchscript=True)

input_sample = "int main(const int argc"
input_ids = tokenizer.encode(input_sample, return_tensors="pt")
print(input_ids)

input_ids = torch.randint(100, (1, 100))

# input_ids = torch.zeros([1024])


input_ids = input_ids.type(torch.IntTensor)

traced_model = torch.jit.trace(model, input_ids)

mlmodel = ct.convert(traced_model, source="pytorch", inputs=[ct.TensorType(shape=input_ids.shape)], convert_to='mlprogram')


mlmodel.save('model.mlpackage')
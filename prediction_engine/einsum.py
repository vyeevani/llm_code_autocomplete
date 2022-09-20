# import torch                                                                                                                                                                                  
# import numpy as np                                                                                                                                                                            
# import coremltools as ct                                                                                                                                                                      
                                                                                                                                                                                              
                                                                                                                                                                                              
# class EinsumModule(torch.nn.Module):                                                                                                                                                          
#     def forward(self, x, y):                                                                                                                                                                  
#         out = torch.einsum("i,j->ij", x, y)                                                                                                                                                   
#         return out                                                                                                                                                                            
                                                                                                                                                                                              
                                                                                                                                                                                              
# model = EinsumModule()                                                                                                                                                                        
# i, j = 2, 3                                                                                                                                                                                   
# x = torch.zeros((i,))                                                                                                                                                                         
# y = torch.zeros((j,))                                                                                                                                                                         
# traced_model = torch.jit.trace(model, (x, y))                                                                                                                                                 
# input_types = [                                                                                                                                                                               
#     ct.TensorType(name="x", dtype=np.float32, shape=x.shape),                                                                                                                                 
#     ct.TensorType(name="y", dtype=np.float32, shape=y.shape),                                                                                                                                 
# ]                                                                                                                                                                                             
# mlmodel = ct.convert(traced_model, source="pytorch", inputs=input_types)

def parse_einsum_equation(equation):
    """
    Args
        equation : str
     parse the equation in the following manner:
     (running example: "nchw,nwhr->nchr")
    step 1: split the equation with delimiter "->"
        e.g.: this will give "nchw,nwhr" and "nchr"
    step 2: split the LHS equation string with delimiter ","
        e.g.: this will give input1 : "nchw", input2: "nwhr"
    step 3: map each character to a unique integer, which is incremented.
            Iterate over input1, input2 and output, in that order.
            e.g.: input 1, i.e., "nchw" will give vector {0,1,2,3}
                  input 2, i.e, "nwhr" will produce {0,3,2,4}
                  output , i.e. "nchr" will produce {0,1,2,4}
    return vectors corresponding to the 2 inputs and the output
    """
    equation = equation.replace(" ", '')
    input_output_str = equation.split('->')
    assert len(input_output_str) == 2, "unsupported einsum equation {}".format(equation)
    input_str = input_output_str[0]
    output_str = input_output_str[1]

    inputs = input_str.split(',')
    assert len(inputs) == 2, "unsupported einsum equation {}".format(equation)
    input1_str = inputs[0]
    input2_str = inputs[1]

    input1_vec = [-1 for i in range(len(input1_str))]
    input2_vec = [-1 for i in range(len(input2_str))]
    output_vec = [-1 for i in range(len(output_str))]
    map_char_to_int = {}

    def _update_vec(str, vec, map_char_to_int, index):
        for i, s in enumerate(str):
            if s not in map_char_to_int:
                map_char_to_int[s] = index
                index += 1
            vec[i] = map_char_to_int[s]
        return index

    index = _update_vec(input1_str, input1_vec, map_char_to_int, 0)
    index = _update_vec(input2_str, input2_vec, map_char_to_int, index)
    index = _update_vec(output_str, output_vec, map_char_to_int, index)

    return input1_vec, input2_vec, output_vec

print(parse_einsum_equation('i , j -> i j'))
import json
import os

class BiSDataExtractor:
    def __init__(self, input_directory):
        self.input_directory = input_directory

    def extract_bis_data(self):
        bis_data = []
        for filename in os.listdir(self.input_directory):
            if filename.endswith('.ts'):
                file_path = os.path.join(self.input_directory, filename)
                bis_data.extend(self.parse_file(file_path))
        return bis_data

    def parse_file(self, file_path):
        # Placeholder for parsing logic
        parsed_data = []
        # Logic to parse TypeScript preset files and extract BiS data
        # Add parsing implementation here
        return parsed_data

    def output_to_json(self, data, output_file):
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=4)

if __name__ == '__main__':
    extractor = BiSDataExtractor(input_directory='path/to/typescript/presets')
    bis_data = extractor.extract_bis_data()
    extractor.output_to_json(bis_data, 'bis_data.json')

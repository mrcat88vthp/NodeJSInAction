import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';
import { faker } from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stream = fs.createWriteStream(path.join(__dirname,'BigData.json'), {flags:'w'});
stream.write('[\n');

const total = 5000;

for(let i = 0; i < total; i++){
    const user = {
        id: i,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number()
    };

    stream.write(JSON.stringify(user, null, 2) + (i < total - 1 ? ',\n' : '\n'));
}

stream.write(']');
stream.end(() => {
    console.log('Ghi file thành công');
})
